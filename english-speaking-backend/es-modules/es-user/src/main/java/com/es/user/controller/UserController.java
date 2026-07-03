package com.es.user.controller;

import com.es.common.dto.Result;
import com.es.user.dto.*;
import com.es.user.service.UserProfileService;
import com.es.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户控制器，处理个人资料、安全中心相关操作
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    private final UserService userService;
    private final UserProfileService userProfileService;

    public UserController(UserService userService, UserProfileService userProfileService) {
        this.userService = userService;
        this.userProfileService = userProfileService;
    }

    /** 查看个人资料 */
    @GetMapping("/profile")
    public Result<UserVO> getProfile() {
        Long userId = getCurrentUserId();
        log.info("查看资料: userId={}", userId);
        UserVO profile = userService.getProfile(userId);
        return Result.ok(profile);
    }

    /** 编辑个人资料 */
    @PutMapping("/profile")
    public Result<Map<String, Object>> updateProfile(@Valid @RequestBody ProfileDTO dto) {
        Long userId = getCurrentUserId();
        log.info("编辑资料: userId={}", userId);
        UserService.UpdateProfileResult result = userService.updateProfile(userId, dto);

        Map<String, Object> data = new HashMap<>();
        data.put("user", result.user());
        if (result.targetChanged()) {
            data.put("message", "内容推荐将同步调整");
        }
        return Result.ok(data);
    }

    /** 获取用户画像（V2.0） */
    @GetMapping("/profile/detail")
    public Result<PortraitVO> getPortrait() {
        Long userId = getCurrentUserId();
        log.info("查看画像: userId={}", userId);
        PortraitVO portrait = userProfileService.getPortrait(userId);
        return Result.ok(portrait);
    }

    // ======================== 安全中心 ========================

    /** 修改密码 */
    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordDTO dto,
                                       HttpServletRequest request) {
        Long userId = getCurrentUserId();
        String ip = getClientIp(request);
        log.info("修改密码: userId={}", userId);
        userService.changePassword(userId, dto, ip);
        return Result.ok(null);
    }

    /** 获取活跃设备列表 */
    @GetMapping("/sessions")
    public Result<List<SessionVO>> getSessions(HttpServletRequest request) {
        Long userId = getCurrentUserId();
        String token = extractToken(request);
        log.info("查询设备列表: userId={}", userId);
        List<SessionVO> sessions = userService.getActiveSessions(userId, token);
        return Result.ok(sessions);
    }

    /** 踢出指定设备 */
    @DeleteMapping("/sessions/{id}")
    public Result<Void> kickSession(@PathVariable String id, HttpServletRequest request) {
        Long userId = getCurrentUserId();
        String currentToken = extractToken(request);
        String ip = getClientIp(request);
        log.info("踢出设备: userId={}, sessionId={}", userId, id);
        userService.kickSession(userId, id, currentToken, ip);
        return Result.ok(null);
    }

    /** 申请账号注销 */
    @PostMapping("/deactivate")
    public Result<String> deactivate(HttpServletRequest request) {
        Long userId = getCurrentUserId();
        String ip = getClientIp(request);
        log.info("申请注销: userId={}", userId);
        userService.requestDeactivation(userId, ip);
        return Result.ok("注销申请已提交，7天内登录将自动撤销");
    }

    /** 撤销注销申请 */
    @PostMapping("/reactivate")
    public Result<String> cancelDeactivation(HttpServletRequest request) {
        Long userId = getCurrentUserId();
        String ip = getClientIp(request);
        log.info("撤销注销: userId={}", userId);
        userService.cancelDeactivation(userId, ip);
        return Result.ok("注销申请已撤销");
    }

    // ======================== 私有方法 ========================

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long)) {
            throw new RuntimeException("未登录或认证已过期");
        }
        return (Long) auth.getPrincipal();
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

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
