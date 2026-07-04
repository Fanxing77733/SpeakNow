package com.es.gamification.dto;

import lombok.Data;

@Data
public class PointsHistoryVO {
    private Long id;
    private int points;
    private String reason;
    private Long referenceId;
    private String createdAt;
}
