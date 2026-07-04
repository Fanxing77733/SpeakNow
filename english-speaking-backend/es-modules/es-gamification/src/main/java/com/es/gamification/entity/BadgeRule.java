package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("badge_rules")
public class BadgeRule {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String badgeType;
    private String badgeName;
    private String badgeDesc;
    private String conditionJson;
    private Integer isActive;
    private LocalDateTime createdAt;
}
