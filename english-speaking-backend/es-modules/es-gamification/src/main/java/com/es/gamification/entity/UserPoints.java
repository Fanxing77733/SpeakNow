package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_points")
public class UserPoints {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Integer points;
    private String reason;
    private Long referenceId;
    private LocalDateTime createdAt;
}
