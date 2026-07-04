package com.es.practice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class RoleplayHistoryVO {

    private Long sessionId;
    private String sceneKey;
    private String sceneNameZh;
    private String difficulty;
    private BigDecimal totalScore;
    private BigDecimal passScore;
    private Boolean isPassed;
    private Integer totalRounds;
    private Integer completedRounds;
    private BigDecimal grammarScore;
    private BigDecimal relevanceScore;
    private BigDecimal fluencyScore;
    private String comment;
    private Integer durationSeconds;
    private LocalDateTime createdAt;
}
