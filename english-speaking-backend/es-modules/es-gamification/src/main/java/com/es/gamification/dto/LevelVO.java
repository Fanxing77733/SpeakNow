package com.es.gamification.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class LevelVO {
    private Long id;
    private int stageId;
    private int levelOrder;
    private String name;
    private String description;
    private BigDecimal passCompletionRate;
    private BigDecimal passAvgScore;
    private String status;
    private int completedTasks;
    private int totalTasks;
    private BigDecimal avgScore;
    private List<StageTaskVO> tasks;
    private String rewardBadgeType;
    private String rewardBadgeName;
    private int rewardPoints;
}
