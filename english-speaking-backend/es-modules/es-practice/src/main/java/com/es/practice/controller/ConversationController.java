package com.es.practice.controller;

import com.es.common.dto.Result;
import com.es.practice.dto.ConversationResultVO;
import com.es.practice.dto.MessageVO;
import com.es.practice.dto.SendMessageResultVO;
import com.es.practice.dto.ScoreResultVO;
import com.es.practice.dto.StartSessionDTO;
import com.es.practice.service.ConversationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 智能情景对话控制器
 * 提供开始会话、发送消息、结束评分三个核心接口
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    /**
     * 开始对话会话
     * @param dto 场景 + 难度选择
     * @return 会话结果（含 sessionId + AI 第一轮消息）
     */
    @PostMapping("/session/start")
    public Result<ConversationResultVO> startSession(@RequestBody StartSessionDTO dto) {
        Long userId = getCurrentUserId();
        log.info("开始会话请求: userId={}, scene={}, difficulty={}", userId, dto.getScene(), dto.getDifficulty());
        ConversationResultVO result = conversationService.startSession(userId, dto);
        return Result.ok(result);
    }

    /**
     * 发送一轮对话消息
     * @param audio     用户录音文件（multipart/form-data）
     * @param sessionId 会话 ID
     * @return 本轮消息结果（含 userText + aiText，对齐 FE Store）
     */
    @PostMapping("/message")
    public Result<SendMessageResultVO> sendMessage(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("sessionId") Long sessionId,
            @RequestParam(value = "duration", required = false) Double durationSeconds) {
        Long userId = getCurrentUserId();
        log.info("对话消息请求: userId={}, sessionId={}, audioSize={}",
                userId, sessionId, audio != null ? audio.getSize() : 0);
        SendMessageResultVO result = conversationService.processMessage(userId, sessionId, audio, durationSeconds);
        return Result.ok(result);
    }

    /**
     * 结束对话会话，独立调用 LLM 评分
     * @param sessionId 会话 ID
     * @return 评分结果（语法/相关性/流利度 + 文字评语）
     */
    @PostMapping("/end/{sessionId}")
    public Result<ScoreResultVO> endSession(@PathVariable Long sessionId) {
        Long userId = getCurrentUserId();
        log.info("结束会话请求: userId={}, sessionId={}", userId, sessionId);
        ScoreResultVO result = conversationService.endSession(userId, sessionId);
        return Result.ok(result);
    }

    /** 从 SecurityContext 获取当前登录用户 ID */
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        throw new RuntimeException("未获取到登录用户信息");
    }
}
