package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("user_level_progress")
public class UserLevelProgress {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long levelId;
    private String status;
    private Integer completedTasks;
    private Integer totalTasks;
    private BigDecimal avgScore;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
