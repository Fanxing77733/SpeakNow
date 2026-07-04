package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("game_levels")
public class GameLevel {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Integer stageId;
    private Integer levelOrder;
    private String name;
    private String description;
    private BigDecimal passCompletionRate;
    private BigDecimal passAvgScore;
    private String tasksJson;
    private Integer rewardBasePoints;
    private String rewardBadgeType;
    private String rewardBadgeName;
    private Integer isActive;
    private LocalDateTime createdAt;
}
