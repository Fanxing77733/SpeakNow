package com.es.gamification.dto;

import lombok.Data;
import java.util.List;

@Data
public class StageVO {
    private int id;
    private String name;
    private int order;
    private boolean unlocked;
    private boolean completed;
    private int requiredScore;
    private int taskCount;
    private int completedCount;
    private List<StageTaskVO> tasks;
    private String rewardBadge;
    private int rewardPoints;
}
