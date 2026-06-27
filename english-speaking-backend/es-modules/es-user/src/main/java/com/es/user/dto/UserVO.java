package com.es.user.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户信息响应体，不含 password_hash，手机号脱敏
 */
@Data
public class UserVO {

    private Long id;
    private String email;
    /** 手机号已脱敏，格式如 138****5678 */
    private String phone;
    private String nickname;
    private String avatarUrl;
    private Integer age;
    private String goal;
    private String level;
    private String cefrLevel;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
