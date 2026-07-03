package com.es.support.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ChatHistoryVO {
    private Long sessionId;
    private String status;
    private Integer satisfaction;
    private List<MessageItem> messages;

    @Data
    @Builder
    public static class MessageItem {
        private String role;
        private String content;
        private BigDecimal confidence;
        private String createdAt;
    }
}
