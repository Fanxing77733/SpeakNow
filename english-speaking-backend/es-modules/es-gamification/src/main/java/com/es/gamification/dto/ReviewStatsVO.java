package com.es.gamification.dto;

import lombok.Data;

/**
 * 录音评分统计 VO
 */
@Data
public class ReviewStatsVO {
    private Long recordingId;
    private int reviewCount;
    private double avgScore;
    private double aiScore;
    private boolean verified;
}
