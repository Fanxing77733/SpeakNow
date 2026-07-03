package com.es.practice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.aigw.adapter.AsrAdapter;
import com.es.aigw.adapter.LlmAdapter;
import com.es.common.exception.BusinessException;
import com.es.practice.dto.SpeechEvalResultVO;
import com.es.practice.dto.SpeechTopicVO;
import com.es.practice.entity.SpeechSession;
import com.es.practice.entity.SpeechTopic;
import com.es.practice.mapper.SpeechSessionMapper;
import com.es.practice.mapper.SpeechTopicMapper;
import com.es.practice.service.SpeechService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SpeechServiceImpl implements SpeechService {

    private final SpeechTopicMapper topicMapper;
    private final SpeechSessionMapper sessionMapper;
    private final AsrAdapter asrAdapter;
    private final LlmAdapter llmAdapter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SpeechServiceImpl(SpeechTopicMapper topicMapper,
                             SpeechSessionMapper sessionMapper,
                             AsrAdapter asrAdapter,
                             LlmAdapter llmAdapter) {
        this.topicMapper = topicMapper;
        this.sessionMapper = sessionMapper;
        this.asrAdapter = asrAdapter;
        this.llmAdapter = llmAdapter;
    }

    @Override
    public List<SpeechTopicVO> getTopics(String category, String difficulty) {
        LambdaQueryWrapper<SpeechTopic> wrapper = new LambdaQueryWrapper<SpeechTopic>()
            .eq(SpeechTopic::getIsPublished, 1);
        if (category != null && !category.isEmpty()) {
            wrapper.eq(SpeechTopic::getCategory, category);
        }
        if (difficulty != null && !difficulty.isEmpty()) {
            wrapper.eq(SpeechTopic::getDifficulty, difficulty);
        }
        return topicMapper.selectList(wrapper).stream()
            .map(this::toVO)
            .collect(Collectors.toList());
    }

    @Override
    public SpeechTopicVO getTopicDetail(Integer topicId) {
        SpeechTopic topic = topicMapper.selectById(topicId);
        if (topic == null) throw new BusinessException(404, "话题不存在");
        SpeechTopicVO vo = toVO(topic);
        return vo;
    }

    @Override
    @Transactional
    public Long startSpeech(Long userId, Integer topicId) {
        SpeechTopic topic = topicMapper.selectById(topicId);
        if (topic == null) throw new BusinessException(404, "话题不存在");

        SpeechSession session = new SpeechSession();
        session.setUserId(userId);
        session.setTopicId(topicId);
        session.setStatus("PREPARING");
        sessionMapper.insert(session);

        log.info("话题陈述开始: userId={}, topicId={}, sessionId={}", userId, topicId, session.getId());
        return session.getId();
    }

    @Override
    @Transactional
    public SpeechEvalResultVO submitSpeech(Long userId, Long sessionId, byte[] audio, int durationSeconds) {
        SpeechSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(404, "会话不存在");
        }
        if (!"PREPARING".equals(session.getStatus()) && !"SPEAKING".equals(session.getStatus())) {
            throw new BusinessException(400, "会话状态不正确");
        }

        session.setDurationSeconds(durationSeconds);

        // 1. ASR 转写
        String asrText;
        try {
            asrText = asrAdapter.recognize(audio);
        } catch (Exception e) {
            log.error("ASR 识别失败", e);
            throw new BusinessException(422, "未能识别语音内容");
        }
        session.setAsrText(asrText);

        // 2. LLM 评估（独立评分 Prompt）
        SpeechTopic topic = topicMapper.selectById(session.getTopicId());
        String evalPrompt = buildEvalPrompt(topic, asrText);
        String evalResponse;
        try {
            evalResponse = llmAdapter.chat(
                "你是一个英语口语评估专家。请严格按照 JSON 格式返回评估结果。",
                List.of(new com.es.aigw.dto.ChatMessage("user", evalPrompt)),
                0.2
            );
        } catch (Exception e) {
            log.error("LLM 评估失败", e);
            throw new BusinessException(503, "服务繁忙，请稍后重试");
        }

        // 3. 解析评分 JSON
        try {
            JsonNode json = objectMapper.readTree(extractJSON(evalResponse));
            session.setGrammarScore(new BigDecimal(json.path("grammar_score").asDouble()).setScale(2, RoundingMode.HALF_UP));
            session.setContentScore(new BigDecimal(json.path("content_score").asDouble()).setScale(2, RoundingMode.HALF_UP));
            session.setFluencyScore(new BigDecimal(json.path("fluency_score").asDouble()).setScale(2, RoundingMode.HALF_UP));
            session.setPronunciationScore(new BigDecimal(json.path("pronunciation_score").asDouble()).setScale(2, RoundingMode.HALF_UP));
            session.setTotalScore(new BigDecimal(json.path("total_score").asDouble()).setScale(2, RoundingMode.HALF_UP));
            session.setComment(json.path("comment").asText());
        } catch (Exception e) {
            log.error("评估结果解析失败: {}", evalResponse, e);
            // 降级：给默认分
            session.setGrammarScore(new BigDecimal("60"));
            session.setContentScore(new BigDecimal("60"));
            session.setFluencyScore(new BigDecimal("60"));
            session.setPronunciationScore(new BigDecimal("60"));
            session.setTotalScore(new BigDecimal("60"));
            session.setComment("评估完成，请查看各项得分。");
        }

        session.setStatus("COMPLETED");
        sessionMapper.updateById(session);

        return SpeechEvalResultVO.builder()
            .sessionId(session.getId())
            .asrText(session.getAsrText())
            .grammarScore(session.getGrammarScore())
            .contentScore(session.getContentScore())
            .fluencyScore(session.getFluencyScore())
            .pronunciationScore(session.getPronunciationScore())
            .totalScore(session.getTotalScore())
            .comment(session.getComment())
            .build();
    }

    @Override
    public SpeechEvalResultVO getResult(Long sessionId) {
        SpeechSession session = sessionMapper.selectById(sessionId);
        if (session == null) throw new BusinessException(404, "会话不存在");
        if (!"COMPLETED".equals(session.getStatus())) {
            throw new BusinessException(400, "评估尚未完成");
        }
        return SpeechEvalResultVO.builder()
            .sessionId(session.getId())
            .asrText(session.getAsrText())
            .grammarScore(session.getGrammarScore())
            .contentScore(session.getContentScore())
            .fluencyScore(session.getFluencyScore())
            .pronunciationScore(session.getPronunciationScore())
            .totalScore(session.getTotalScore())
            .comment(session.getComment())
            .build();
    }

    private String buildEvalPrompt(SpeechTopic topic, String asrText) {
        return String.format(
            "请对以下英语话题陈述进行评估。\n\n" +
            "话题：%s\n" +
            "话题类别：%s\n\n" +
            "陈述内容（ASR转写）：%s\n\n" +
            "请从以下四个维度评分，每个维度满分 100 分：\n" +
            "1. grammar_score：语法准确性（25%%）\n" +
            "2. content_score：内容相关性和逻辑性（25%%）\n" +
            "3. fluency_score：流利度和连贯性（25%%）\n" +
            "4. pronunciation_score：发音准确度（25%%）\n\n" +
            "total_score = (grammar + content + fluency + pronunciation) / 4\n\n" +
            "请以 JSON 格式返回，格式为：\n" +
            "{\"grammar_score\": 85, \"content_score\": 80, \"fluency_score\": 75, \"pronunciation_score\": 82, \"total_score\": 80.5, \"comment\": \"综合评语\"}\n" +
            "comment 请用中文撰写，包含优点和改进建议，不超过 200 字。",
            topic.getTitle(), topic.getCategory(), asrText
        );
    }

    private String extractJSON(String response) {
        if (response == null) return "{}";
        int start = response.indexOf("{");
        int end = response.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }
        return "{}";
    }

    private SpeechTopicVO toVO(SpeechTopic topic) {
        return SpeechTopicVO.builder()
            .id(topic.getId())
            .title(topic.getTitle())
            .description(topic.getDescription())
            .category(topic.getCategory())
            .difficulty(topic.getDifficulty())
            .preparationSeconds(topic.getPreparationSeconds())
            .speechSecondsMin(topic.getSpeechSecondsMin())
            .speechSecondsMax(topic.getSpeechSecondsMax())
            .build();
    }
}
