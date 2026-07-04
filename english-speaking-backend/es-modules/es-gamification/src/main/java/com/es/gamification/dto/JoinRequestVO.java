package com.es.gamification.dto;

import lombok.Data;

@Data
public class JoinRequestVO {
    private Long id;
    private Long userId;
    private String userName;
    private String status;
    private String requestedAt;
}
