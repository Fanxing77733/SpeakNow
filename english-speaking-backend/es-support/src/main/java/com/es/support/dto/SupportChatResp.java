package com.es.support.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SupportChatResp {
    private Long sessionId;
    private String message;
    private BigDecimal confidence;
    private boolean isEscalated;
    private Long ticketId;
}
