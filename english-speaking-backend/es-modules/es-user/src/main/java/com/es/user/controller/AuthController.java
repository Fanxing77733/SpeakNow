package com.es.user.controller;

import com.es.common.dto.Result;
import com.es.user.dto.LoginDTO;
import com.es.user.dto.LoginResult;
import com.es.user.dto.RegisterDTO;
import com.es.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 认证控制器，处理注册和登录
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;

    @Value("${wechat.app-id:}")
    private String wechatAppId;

    @Value("${wechat.app-secret:}")
    private String wechatAppSecret;

    @Value("${wechat.redirect-uri:http://localhost:5173/login}")
    private String wechatRedirectUri;

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

    /** 微信 OAuth 授权 — 重定向到微信授权页 */
    @GetMapping("/wechat/authorize")
    public void wechatAuthorize(HttpServletResponse response) throws IOException {
        if (wechatAppId.isEmpty()) {
            response.sendRedirect("/login?error=wechat_not_configured");
            return;
        }
        String redirectUri = URLEncoder.encode(wechatRedirectUri, StandardCharsets.UTF_8);
        String url = String.format(
            "https://open.weixin.qq.com/connect/oauth2/authorize?appid=%s&redirect_uri=%s&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect",
            wechatAppId, redirectUri
        );
        response.sendRedirect(url);
    }

    /** 微信 OAuth 回调 — 用 code 换 token，登录或注册 */
    @GetMapping("/wechat/callback")
    public void wechatCallback(@RequestParam String code,
                                @RequestParam(required = false) String state,
                                HttpServletRequest request,
                                HttpServletResponse response) throws IOException {
        log.info("微信 OAuth 回调: code={}", code);
        try {
            LoginResult result = userService.loginByWechat(code, getClientIp(request));
            // 重定向到前端，通过 URL 参数传递 token
            String redirectUrl = String.format("/login?token=%s&userId=%d",
                URLEncoder.encode(result.getToken(), StandardCharsets.UTF_8),
                result.getUser().getId());
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            log.error("微信登录失败", e);
            response.sendRedirect("/login?error=wechat_login_failed");
        }
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
