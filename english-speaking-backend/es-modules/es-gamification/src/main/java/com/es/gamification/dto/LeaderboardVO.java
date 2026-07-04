package com.es.gamification.dto;

import lombok.Data;

@Data
public class LeaderboardVO {
    private int rank;
    private Long userId;
    private String userName;
    private int score;
}
