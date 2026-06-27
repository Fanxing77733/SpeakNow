package com.es.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 登录/注册成功响应体，包含 JWT Token 和用户信息
 */
@Data
@AllArgsConstructor
public class LoginResult {

    private String token;
    private UserVO user;
}
