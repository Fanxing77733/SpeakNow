package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("user_badges")
public class UserBadge {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String badgeType;
    private String badgeName;
    private LocalDateTime earnedAt;
}
