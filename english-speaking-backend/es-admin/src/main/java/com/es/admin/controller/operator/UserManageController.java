package com.es.admin.controller.operator;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.es.admin.dto.BanUserDTO;
import com.es.admin.dto.UserSearchDTO;
import com.es.admin.service.UserManageService;
import com.es.common.dto.Result;
import com.es.user.dto.UserVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/operator")
public class UserManageController {

    private final UserManageService userManageService;

    public UserManageController(UserManageService userManageService) {
        this.userManageService = userManageService;
    }

    /** 用户搜索（分页） */
    @GetMapping("/users")
    public Result<Page<UserVO>> searchUsers(@ModelAttribute UserSearchDTO dto) {
        Long operatorId = getCurrentUserId();
        log.info("运营搜索用户: operatorId={}, keyword={}", operatorId, dto.getKeyword());
        Page<UserVO> result = userManageService.searchUsers(dto);
        return Result.ok(result);
    }

    /** 封禁用户 */
    @PostMapping("/users/{id}/ban")
    public Result<Void> banUser(@PathVariable Long id,
                                 @Valid @RequestBody BanUserDTO dto,
                                 HttpServletRequest request) {
        Long operatorId = getCurrentUserId();
        String ip = getClientIp(request);
        log.info("封禁用户: operatorId={}, userId={}", operatorId, id);
        userManageService.banUser(id, dto.getReason(), operatorId, ip);
        return Result.ok(null);
    }

    /** 解封用户 */
    @PostMapping("/users/{id}/unban")
    public Result<Void> unbanUser(@PathVariable Long id, HttpServletRequest request) {
        Long operatorId = getCurrentUserId();
        String ip = getClientIp(request);
        log.info("解封用户: operatorId={}, userId={}", operatorId, id);
        userManageService.unbanUser(id, operatorId, ip);
        return Result.ok(null);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) return xff.split(",")[0].trim();
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isEmpty()) return xri;
        return request.getRemoteAddr();
    }
}
