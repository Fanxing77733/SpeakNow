package com.es.admin.controller;

import com.es.admin.dto.JoinClassDTO;
import com.es.admin.service.ClassService;
import com.es.common.dto.Result;
import com.es.admin.entity.Assignment;
import com.es.admin.entity.ClassInfo;
import com.es.admin.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 学生加入班级控制器 — 映射到 /api/v1/user/class 供学习者使用
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/user/class")
public class JoinClassController {

    private final ClassService classService;
    private final AssignmentService assignmentService;

    public JoinClassController(ClassService classService, AssignmentService assignmentService) {
        this.classService = classService;
        this.assignmentService = assignmentService;
    }

    /** 学生通过邀请码加入班级 */
    @PostMapping("/join")
    public Result<String> joinByCode(@Valid @RequestBody JoinClassDTO dto) {
        Long studentId = getCurrentUserId();
        log.info("加入班级: studentId={}, inviteCode={}", studentId, dto.getInviteCode());
        classService.joinByInviteCode(dto.getInviteCode(), studentId);
        return Result.ok("加入班级成功");
    }

    /** 学生查看已加入的班级 */
    @GetMapping("/my")
    public Result<List<ClassInfo>> getMyClasses() {
        Long studentId = getCurrentUserId();
        return Result.ok(classService.getMyEnrolledClasses(studentId));
    }

    /** 学生查看已加入班级的作业 */
    @GetMapping("/assignments")
    public Result<List<Assignment>> getMyAssignments() {
        Long studentId = getCurrentUserId();
        List<ClassInfo> classes = classService.getMyEnrolledClasses(studentId);
        List<Long> classIds = classes.stream().map(ClassInfo::getId).toList();
        return Result.ok(assignmentService.getAssignmentsByClassIds(classIds));
    }

    /** 学生查看单个作业详情（含场景/难度配置，供练习页使用） */
    @GetMapping("/assignments/{assignmentId}")
    public Result<Assignment> getAssignmentDetail(@PathVariable Long assignmentId) {
        return Result.ok(assignmentService.getAssignmentDetail(assignmentId));
    }

    /** 学生查看自己的提交记录和点评 */
    @GetMapping("/submissions")
    public Result<List<Map<String, Object>>> getMySubmissions() {
        Long studentId = getCurrentUserId();
        return Result.ok(assignmentService.getStudentSubmissions(studentId));
    }

    /** 学生提交作业（文本） */
    @PostMapping("/assignments/{assignmentId}/submit")
    public Result<String> submitAssignment(@PathVariable Long assignmentId,
                                            @RequestBody Map<String, String> body) {
        Long studentId = getCurrentUserId();
        String text = body.getOrDefault("text", "");
        log.info("提交作业: studentId={}, assignmentId={}", studentId, assignmentId);
        assignmentService.submitAssignment(studentId, assignmentId, text);
        return Result.ok("提交成功");
    }

    /** 学生以情景对话记录提交作业 */
    @PostMapping("/assignments/{assignmentId}/submit-conversation")
    public Result<String> submitConversation(@PathVariable Long assignmentId,
                                              @RequestBody Map<String, Long> body) {
        Long studentId = getCurrentUserId();
        Long sessionId = body.get("sessionId");
        if (sessionId == null) {
            return Result.fail(400, "请提供对话记录ID");
        }
        log.info("对话提交作业: studentId={}, assignmentId={}, sessionId={}", studentId, assignmentId, sessionId);
        assignmentService.submitConversationAssignment(studentId, assignmentId, sessionId);
        return Result.ok("提交成功");
    }

    /** 学生以跟读练习记录提交作业 */
    @PostMapping("/assignments/{assignmentId}/submit-pronounce")
    public Result<String> submitPronounce(@PathVariable Long assignmentId,
                                           @RequestBody Map<String, Long> body) {
        Long studentId = getCurrentUserId();
        Long recordId = body.get("recordId");
        if (recordId == null) {
            return Result.fail(400, "请提供练习记录ID");
        }
        log.info("跟读提交作业: studentId={}, assignmentId={}, recordId={}", studentId, assignmentId, recordId);
        assignmentService.submitPronounceAssignment(studentId, assignmentId, recordId);
        return Result.ok("提交成功");
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}
