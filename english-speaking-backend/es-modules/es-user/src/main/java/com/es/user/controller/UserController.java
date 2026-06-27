package com.es.user.controller;

import com.es.common.dto.Result;
import com.es.user.dto.ProfileDTO;
import com.es.user.dto.UserVO;
import com.es.user.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户控制器，处理个人资料查看和编辑
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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

    /** 从 SecurityContext 获取当前登录用户 ID */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long)) {
            throw new RuntimeException("未登录或认证已过期");
        }
        return (Long) auth.getPrincipal();
    }
}
