package com.es.support.controller;

import com.es.common.dto.Result;
import com.es.support.dto.ChatHistoryVO;
import com.es.support.dto.SupportChatReq;
import com.es.support.dto.SupportChatResp;
import com.es.support.service.SupportChatService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/support/chat")
public class SupportChatController {

    private final SupportChatService supportChatService;

    public SupportChatController(SupportChatService supportChatService) {
        this.supportChatService = supportChatService;
    }

    /** 发送客服消息 */
    @PostMapping
    public Result<SupportChatResp> sendMessage(@Valid @RequestBody SupportChatReq req) {
        Long userId = getCurrentUserId();
        log.info("客服消息: userId={}, sessionId={}", userId, req.getSessionId());
        SupportChatResp resp = supportChatService.chat(userId, req.getMessage(), req.getSessionId());
        return Result.ok(resp);
    }

    /** 获取会话历史 */
    @GetMapping("/history/{sessionId}")
    public Result<ChatHistoryVO> getHistory(@PathVariable Long sessionId) {
        Long userId = getCurrentUserId();
        ChatHistoryVO history = supportChatService.getHistory(userId, sessionId);
        return Result.ok(history);
    }

    /** 满意度反馈 */
    @PostMapping("/{sessionId}/feedback")
    public Result<Void> submitFeedback(@PathVariable Long sessionId, @RequestParam int rating) {
        supportChatService.submitFeedback(sessionId, rating);
        return Result.ok(null);
    }

    /** 转人工：创建工单 */
    @PostMapping("/ticket")
    public Result<Long> createTicket(@RequestParam(required = false) Long sessionId) {
        Long userId = getCurrentUserId();
        Long ticketId = supportChatService.createTicket(userId, sessionId != null ? sessionId : 0L);
        return Result.ok(ticketId);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}
