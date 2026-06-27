package com.es.learning.controller;

import com.es.common.dto.Result;
import com.es.learning.dto.ProgressSummaryVO;
import com.es.learning.service.ProgressService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 学习进度控制器 — 进度汇总查询接口
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    /**
     * 获取学习进度汇总
     * 从 SecurityContext 获取当前用户 ID，聚合三表数据
     *
     * @return ProgressSummaryVO { empty, summary }
     */
    @GetMapping("/summary")
    public Result<ProgressSummaryVO> getSummary() {
        Long userId = getCurrentUserId();
        log.info("获取学习进度汇总: userId={}", userId);
        ProgressSummaryVO summary = progressService.getSummary(userId);
        return Result.ok(summary);
    }

    /**
     * 从 SecurityContext 获取当前登录用户 ID
     */
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long id) {
            return id;
        }
        throw new RuntimeException("未获取到登录用户信息");
    }
}
