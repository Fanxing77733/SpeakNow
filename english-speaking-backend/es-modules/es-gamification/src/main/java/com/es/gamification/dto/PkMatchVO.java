package com.es.gamification.dto;

import lombok.Data;

/**
 * PK 对战 VO
 */
@Data
public class PkMatchVO {
    private Long id;
    private String status;
    private Long wordListId;
    private String wordListName;
    private Double myScore;
    private Double opponentScore;
    private String opponentName;
    private String result;
    private int pointsEarned;
}
