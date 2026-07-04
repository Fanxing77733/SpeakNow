package com.es.security.aspect;

import com.es.common.annotation.RequireRole;
import com.es.security.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;
import java.util.Set;

/**
 * 角色校验切面，配合 @RequireRole 注解做方法级权限控制
 */
@Slf4j
@Aspect
@Component
public class RoleAspect {

    private final JwtUtil jwtUtil;

    public RoleAspect(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Before("@annotation(requireRole)")
    public void checkRole(RequireRole requireRole) {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            throw new SecurityException("无法获取请求上下文");
        }

        HttpServletRequest request = attrs.getRequest();
        String token = extractToken(request);
        if (token == null) {
            throw new SecurityException("未登录或认证已过期");
        }

        String role = jwtUtil.getRoleFromToken(token);
        Set<String> allowedRoles = Set.of(requireRole.value());

        if (!allowedRoles.contains(role)) {
            log.warn("角色校验失败: required={}, actual={}", Arrays.toString(requireRole.value()), role);
            throw new SecurityException("没有权限执行此操作");
        }
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
