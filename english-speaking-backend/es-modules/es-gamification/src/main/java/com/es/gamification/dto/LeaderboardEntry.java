package com.es.gamification.dto;

import lombok.Data;

/**
 * 排行榜条目
 */
@Data
public class LeaderboardEntry {
    private int rank;
    private Long userId;
    private String userName;
    private int score;
}
