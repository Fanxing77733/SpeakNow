package com.es.practice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.aigw.adapter.AsrAdapter;
import com.es.aigw.adapter.LlmAdapter;
import com.es.aigw.dto.ChatMessage;
import com.es.aigw.dto.DialogueScoreResult;
import com.es.aigw.util.AudioValidator;
import com.es.common.exception.BusinessException;
import com.es.practice.dto.ConversationResultVO;
import com.es.practice.dto.MessageVO;
import com.es.practice.dto.SendMessageResultVO;
import com.es.practice.dto.ScoreResultVO;
import com.es.practice.dto.StartSessionDTO;
import com.es.practice.entity.ConversationMessage;
import com.es.practice.entity.ConversationSession;
import com.es.practice.mapper.ConversationMessageMapper;
import com.es.practice.mapper.ConversationSessionMapper;
import com.es.practice.service.ConversationService;
import com.es.practice.service.ScenePromptService;
import com.es.practice.util.InputFilter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 智能情景对话业务逻辑实现
 */
@Slf4j
@Service
public class ConversationServiceImpl implements ConversationService {

    private final ConversationSessionMapper sessionMapper;
    private final ConversationMessageMapper messageMapper;
    private final ScenePromptService scenePromptService;
    private final LlmAdapter llmAdapter;
    private final AsrAdapter asrAdapter;
    private final AudioValidator audioValidator;
    private final InputFilter inputFilter;

    public ConversationServiceImpl(ConversationSessionMapper sessionMapper,
                                   ConversationMessageMapper messageMapper,
                                   ScenePromptService scenePromptService,
                                   LlmAdapter llmAdapter,
                                   AsrAdapter asrAdapter,
                                   AudioValidator audioValidator,
                                   InputFilter inputFilter) {
        this.sessionMapper = sessionMapper;
        this.messageMapper = messageMapper;
        this.scenePromptService = scenePromptService;
        this.llmAdapter = llmAdapter;
        this.asrAdapter = asrAdapter;
        this.audioValidator = audioValidator;
        this.inputFilter = inputFilter;
    }

    @Override
    @Transactional
    public ConversationResultVO startSession(Long userId, StartSessionDTO dto) {
        // 1. 校验场景参数
        String scene = dto.getScene();
        if (scene == null || scene.isBlank()) {
            throw new BusinessException(400, "请选择对话场景");
        }

        // 2. 检查用户是否有 active 状态的会话
        if (hasActiveSession(userId)) {
            throw new BusinessException(409, "有进行中的对话，请先结束或继续");
        }

        // 3. 加载场景 Prompt 模板
        String systemPrompt = scenePromptService.loadScenePrompt(scene);
        log.info("开始情景对话: userId={}, scene={}, difficulty={}", userId, scene, dto.getDifficulty());

        // 4. 创建 conversation_sessions 记录
        ConversationSession session = new ConversationSession();
        session.setUserId(userId);
        session.setScene(scene);
        session.setDifficulty(dto.getDifficulty() != null ? dto.getDifficulty() : "beginner");
        session.setStatus("active");
        session.setTotalRounds(0);
        session.setTotalDurationSeconds(0);
        session.setCreatedAt(LocalDateTime.now());
        sessionMapper.insert(session);
        log.info("对话会话已创建: sessionId={}, userId={}, scene={}", session.getId(), userId, scene);

        // 5. 调用 LLM 生成 AI 第一轮回复
        String aiReply;
        try {
            aiReply = llmAdapter.chat(systemPrompt, new ArrayList<>(), 0.7);
        } catch (Exception e) {
            log.error("LLM 调用失败: sessionId={}", session.getId(), e);
            session.setStatus("llm_timeout");
            sessionMapper.updateById(session);
            throw new BusinessException(503, "服务繁忙，请稍后重试");
        }

        // 6. 写入 AI 第一轮消息（round=1）
        ConversationMessage aiMessage = new ConversationMessage();
        aiMessage.setSessionId(session.getId());
        aiMessage.setRound(1);
        aiMessage.setRole("ai");
        aiMessage.setContent(aiReply);
        aiMessage.setCreatedAt(LocalDateTime.now());
        messageMapper.insert(aiMessage);

        // 7. 构建返回 VO
        ConversationResultVO result = new ConversationResultVO();
        result.setSessionId(session.getId());
        result.setScene(scene);
        result.setStatus("active");
        result.setTotalRounds(1);

        MessageVO firstMessage = new MessageVO();
        firstMessage.setRound(1);
        firstMessage.setRole("ai");
        firstMessage.setContent(aiReply);
        firstMessage.setCreatedAt(aiMessage.getCreatedAt());
        result.setFirstMessage(firstMessage);

        return result;
    }

    @Override
    @Transactional
    public SendMessageResultVO processMessage(Long userId, Long sessionId, MultipartFile audioFile, Double durationSeconds) {
        // 1. 校验 session 存在且属于当前用户
        ConversationSession session = getAndValidateSession(sessionId, userId);

        // 2. 校验 session 状态为 active
        if (!"active".equals(session.getStatus())) {
            throw new BusinessException(404, "会话已结束或不存在");
        }

        // 3. 音频校验（≥0.5s, ≤60s, ≤5MB）
        byte[] audioBytes;
        try {
            audioBytes = audioFile.getBytes();
        } catch (IOException e) {
            log.error("读取音频文件失败: sessionId={}", sessionId, e);
            throw new BusinessException(422, "未收到录音数据，请重新录制");
        }

        AudioValidator.ValidationResult validation = audioValidator.validate(audioBytes, durationSeconds != null ? durationSeconds : -1.0);
        if (!validation.isValid()) {
            throw new BusinessException(422, validation.getErrorMessage());
        }

        // 4. ASR 语音转写
        String asrText = asrAdapter.recognize(audioBytes);
        if (asrText == null || asrText.isBlank()) {
            log.warn("ASR 识别失败: sessionId={}", sessionId);
            throw new BusinessException(422, "未能识别语音内容，请确保发音清晰");
        }
        log.info("ASR 识别成功: sessionId={}, asrText={}", sessionId, asrText);

        // 5. 输入过滤（长度截断 + 敏感词检测）
        String filteredText = inputFilter.filter(asrText);
        log.info("输入过滤完成: sessionId={}, originalLength={}, filteredLength={}",
                sessionId, asrText.length(), filteredText.length());

        // 6. 计算下一轮次编号
        int nextRound = getNextRound(sessionId);

        // 7. 写入用户消息
        ConversationMessage userMessage = new ConversationMessage();
        userMessage.setSessionId(sessionId);
        userMessage.setRound(nextRound);
        userMessage.setRole("user");
        userMessage.setContent(filteredText);
        userMessage.setCreatedAt(LocalDateTime.now());
        messageMapper.insert(userMessage);

        // 8. 组装对话历史 + System Prompt
        String systemPrompt = scenePromptService.loadScenePrompt(session.getScene());
        List<ChatMessage> history = buildChatHistory(sessionId);

        // 9. 调用 LLM 生成 AI 回复
        String aiReply;
        try {
            aiReply = llmAdapter.chat(systemPrompt, history, 0.7);
        } catch (Exception e) {
            log.error("LLM 调用失败: sessionId={}", sessionId, e);
            throw new BusinessException(503, "服务繁忙，请稍后再试");
        }

        // 10. 写入 AI 回复（同一轮次）
        ConversationMessage aiMessage = new ConversationMessage();
        aiMessage.setSessionId(sessionId);
        aiMessage.setRound(nextRound);
        aiMessage.setRole("ai");
        aiMessage.setContent(aiReply);
        aiMessage.setCreatedAt(LocalDateTime.now());
        messageMapper.insert(aiMessage);

        // 11. 更新会话总轮数和时长
        session.setTotalRounds(nextRound);
        sessionMapper.updateById(session);

        log.info("对话轮次完成: sessionId={}, round={}", sessionId, nextRound);

        // 12. 返回本轮消息结果（userText + aiText，对齐 FE Store）
        SendMessageResultVO result = new SendMessageResultVO();
        result.setRound(nextRound);
        result.setUserText(filteredText);
        result.setAiText(aiReply);
        result.setSessionId(sessionId);
        result.setTotalRounds(nextRound);
        return result;
    }

    @Override
    @Transactional
    public ScoreResultVO endSession(Long userId, Long sessionId) {
        // 1. 校验 session 存在且属于当前用户
        ConversationSession session = getAndValidateSession(sessionId, userId);

        // 2. 校验状态为 active
        if (!"active".equals(session.getStatus())) {
            throw new BusinessException(404, "会话已结束或不存在");
        }

        // 3. 统计成功轮次（所有已写入数据库的用户消息数）
        int successfulRounds = countSuccessfulRounds(sessionId);
        if (successfulRounds == 0) {
            // 没有成功轮次，直接标记完成，不给评分
            session.setStatus("completed");
            session.setTotalRounds(0);
            sessionMapper.updateById(session);
            log.info("对话会话结束（无有效轮次）: sessionId={}", sessionId);

            ScoreResultVO scoreResult = new ScoreResultVO();
            scoreResult.setSessionId(sessionId);
            scoreResult.setComment("本次对话未产生有效的对话轮次，请重新开始并尝试说话。");
            return scoreResult;
        }

        // 4. 组装完整对话文本
        String fullDialogue = buildFullDialogue(sessionId);

        // 5. 独立评分调用（Temperature=0.2 确保评分稳定）
        DialogueScoreResult scoreResult;
        try {
            scoreResult = llmAdapter.scoreDialogue(fullDialogue);
        } catch (Exception e) {
            log.error("LLM 评分调用失败: sessionId={}", sessionId, e);
            throw new BusinessException(503, "评分服务繁忙，请稍后重试");
        }

        // 6. 更新 conversation_sessions（评分字段 + status=completed）
        session.setStatus("completed");
        session.setTotalRounds(successfulRounds);
        session.setGrammarScore(scoreResult.getGrammarScore());
        session.setRelevanceScore(scoreResult.getRelevanceScore());
        session.setFluencyScore(scoreResult.getFluencyScore());
        session.setTotalScore(scoreResult.getTotalScore());
        sessionMapper.updateById(session);

        log.info("对话评分完成: sessionId={}, totalRounds={}, grammar={}, relevance={}, fluency={}, total={}",
                sessionId, successfulRounds,
                scoreResult.getGrammarScore(), scoreResult.getRelevanceScore(),
                scoreResult.getFluencyScore(), scoreResult.getTotalScore());

        // 7. 返回评分结果
        ScoreResultVO vo = new ScoreResultVO();
        vo.setSessionId(sessionId);
        vo.setGrammarScore(scoreResult.getGrammarScore());
        vo.setRelevanceScore(scoreResult.getRelevanceScore());
        vo.setFluencyScore(scoreResult.getFluencyScore());
        vo.setTotalScore(scoreResult.getTotalScore());
        vo.setComment(scoreResult.getComment());
        return vo;
    }

    // ======================== 私有方法 ========================

    /** 检查用户是否有 active 状态的会话 */
    private boolean hasActiveSession(Long userId) {
        LambdaQueryWrapper<ConversationSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ConversationSession::getUserId, userId)
                .eq(ConversationSession::getStatus, "active");
        return sessionMapper.selectCount(wrapper) > 0;
    }

    /** 获取并校验会话归属 */
    private ConversationSession getAndValidateSession(Long sessionId, Long userId) {
        ConversationSession session = sessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException(404, "会话不存在或已结束");
        }
        if (!session.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作该会话");
        }
        return session;
    }

    /** 计算下一轮次编号 */
    private int getNextRound(Long sessionId) {
        LambdaQueryWrapper<ConversationMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ConversationMessage::getSessionId, sessionId)
                .orderByDesc(ConversationMessage::getRound)
                .last("LIMIT 1");
        ConversationMessage lastMessage = messageMapper.selectOne(wrapper);
        return lastMessage != null ? lastMessage.getRound() + 1 : 1;
    }

    /** 构建 LLM 对话历史（仅 role=user 和 role=ai 的消息，按 round 排序） */
    private List<ChatMessage> buildChatHistory(Long sessionId) {
        LambdaQueryWrapper<ConversationMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ConversationMessage::getSessionId, sessionId)
                .orderByAsc(ConversationMessage::getRound)
                .orderByAsc(ConversationMessage::getCreatedAt);
        List<ConversationMessage> messages = messageMapper.selectList(wrapper);

        return messages.stream()
                .map(m -> new ChatMessage(m.getRole(), m.getContent()))
                .collect(Collectors.toList());
    }

    /** 统计成功轮次（role=user 的消息数） */
    private int countSuccessfulRounds(Long sessionId) {
        LambdaQueryWrapper<ConversationMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ConversationMessage::getSessionId, sessionId)
                .eq(ConversationMessage::getRole, "user");
        return Math.toIntExact(messageMapper.selectCount(wrapper));
    }

    /** 组装完整对话文本用于评分 */
    private String buildFullDialogue(Long sessionId) {
        LambdaQueryWrapper<ConversationMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ConversationMessage::getSessionId, sessionId)
                .orderByAsc(ConversationMessage::getRound)
                .orderByAsc(ConversationMessage::getCreatedAt);
        List<ConversationMessage> messages = messageMapper.selectList(wrapper);

        StringBuilder sb = new StringBuilder();
        for (ConversationMessage msg : messages) {
            if ("user".equals(msg.getRole())) {
                sb.append("User: ").append(msg.getContent()).append("\n");
            } else if ("ai".equals(msg.getRole())) {
                sb.append("AI: ").append(msg.getContent()).append("\n");
            }
        }
        return sb.toString();
    }
}
