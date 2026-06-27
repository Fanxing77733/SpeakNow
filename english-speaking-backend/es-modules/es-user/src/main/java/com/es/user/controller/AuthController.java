package com.es.user.controller;

import com.es.common.dto.Result;
import com.es.user.dto.LoginDTO;
import com.es.user.dto.LoginResult;
import com.es.user.dto.RegisterDTO;
import com.es.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证控制器，处理注册和登录
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /** 用户注册 */
    @PostMapping("/register")
    public Result<LoginResult> register(@Valid @RequestBody RegisterDTO dto,
                                         HttpServletRequest request) {
        String ip = getClientIp(request);
        log.info("注册请求: ip={}, email={}, phone={}", ip, dto.getEmail(), dto.getPhone());
        LoginResult result = userService.register(dto, ip);
        return Result.ok(result);
    }

    /** 用户登录 */
    @PostMapping("/login")
    public Result<LoginResult> login(@Valid @RequestBody LoginDTO dto,
                                      HttpServletRequest request) {
        String ip = getClientIp(request);
        log.info("登录请求: ip={}, account={}", ip, dto.getAccount());
        LoginResult result = userService.login(dto, ip);
        return Result.ok(result);
    }

    /** 获取客户端真实 IP */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
