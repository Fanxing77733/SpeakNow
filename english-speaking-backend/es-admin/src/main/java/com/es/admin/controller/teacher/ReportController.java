package com.es.admin.controller.teacher;

import com.es.admin.service.ReportService;
import com.es.common.dto.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/teacher")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /** 班级概览报告 */
    @GetMapping("/reports/class")
    public Result<Map<String, Object>> getClassReport(@RequestParam Long classId) {
        Long teacherId = getCurrentUserId();
        log.info("查看班级报告: teacherId={}, classId={}", teacherId, classId);
        return Result.ok(reportService.getClassOverview(classId, teacherId));
    }

    /** 个体学生报告 */
    @GetMapping("/reports/student/{id}")
    public Result<Map<String, Object>> getStudentReport(@PathVariable Long id) {
        Long teacherId = getCurrentUserId();
        log.info("查看学生报告: teacherId={}, studentId={}", teacherId, id);
        return Result.ok(reportService.getStudentReport(id, teacherId));
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}
