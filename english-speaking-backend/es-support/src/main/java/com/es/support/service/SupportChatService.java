package com.es.support.service;

import com.es.support.dto.ChatHistoryVO;
import com.es.support.dto.SupportChatResp;

public interface SupportChatService {
    SupportChatResp chat(Long userId, String message, Long sessionId);
    ChatHistoryVO getHistory(Long userId, Long sessionId);
    void submitFeedback(Long sessionId, int rating);
    Long createTicket(Long userId, Long sessionId);
}
