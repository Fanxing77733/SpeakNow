package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("point_rules")
public class PointRule {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String ruleCode;
    private Integer points;
    private String description;
    private Integer isActive;
    private LocalDateTime createdAt;
}
