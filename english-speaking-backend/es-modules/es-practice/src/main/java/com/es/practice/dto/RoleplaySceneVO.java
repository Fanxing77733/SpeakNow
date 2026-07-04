package com.es.practice.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RoleplaySceneVO {

    private Long id;
    private String sceneKey;
    private String nameZh;
    private String nameEn;
    private String descriptionZh;
    private String difficulty;
    private String difficultyLabel;
    private String userRoleZh;
    private String aiRoleZh;
    private String aiPersonality;
    private String objectiveZh;
    private Integer totalRounds;
    private BigDecimal passScore;
    private String iconEmoji;
    private String category;
}
