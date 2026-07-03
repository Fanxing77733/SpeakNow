package com.es.admin.controller.operator;

import com.es.admin.service.DashboardService;
import com.es.common.dto.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/operator")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /** 核心指标概览 */
    @GetMapping("/dashboard/overview")
    public Result<Map<String, Object>> getOverview() {
        Long operatorId = getCurrentUserId();
        log.info("查看运营概览: operatorId={}", operatorId);
        return Result.ok(dashboardService.getOverview());
    }

    /** 用户统计 */
    @GetMapping("/dashboard/users")
    public Result<Map<String, Object>> getUserStats() {
        Long operatorId = getCurrentUserId();
        log.info("查看用户统计: operatorId={}", operatorId);
        return Result.ok(dashboardService.getUserStats());
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}
