package com.es.user.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体类，映射 users 表
 */
@Data
@TableName("`users`")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String email;

    private String phone;

    private String passwordHash;

    private String nickname;

    private String avatarUrl;

    private Integer age;

    /** 学习目标: daily / exam / business */
    private String goal;

    /** V1.0水平等级: beginner / intermediate / advanced */
    private String level;

    /** V2.0 CEFR等级: A1 / A2 / B1 / B2 / C1 / C2 */
    private String cefrLevel;

    /** 账号状态: active / locked / deleted */
    private String status;

    private LocalDateTime lastLoginAt;

    private String lastLoginIp;

    /** 灰度特征标志 (JSON) */
    private String featureFlags;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
