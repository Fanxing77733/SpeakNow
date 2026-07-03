package com.es.admin.controller.teacher;

import com.es.admin.dto.AssignmentCreateDTO;
import com.es.admin.dto.ReviewSubmissionDTO;
import com.es.admin.entity.Assignment;
import com.es.admin.entity.AssignmentSubmission;
import com.es.admin.service.AssignmentService;
import com.es.common.dto.Result;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/teacher")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    /** 作业列表 */
    @GetMapping("/assignments")
    public Result<List<Assignment>> getAssignments(@RequestParam(required = false) Long classId) {
        Long teacherId = getCurrentUserId();
        return Result.ok(assignmentService.getAssignments(teacherId, classId));
    }

    /** 作业详情 */
    @GetMapping("/assignments/{id}")
    public Result<Assignment> getAssignment(@PathVariable Long id) {
        return Result.ok(assignmentService.getAssignmentDetail(id));
    }

    /** 创建作业 */
    @PostMapping("/assignments")
    public Result<Assignment> createAssignment(@Valid @RequestBody AssignmentCreateDTO dto) {
        Long teacherId = getCurrentUserId();
        log.info("创建作业: teacherId={}, title={}", teacherId, dto.getTitle());
        return Result.ok(assignmentService.createAssignment(teacherId, dto));
    }

    /** 提交列表 */
    @GetMapping("/assignments/{id}/submissions")
    public Result<List<AssignmentSubmission>> getSubmissions(@PathVariable Long id) {
        Long teacherId = getCurrentUserId();
        return Result.ok(assignmentService.getSubmissions(id, teacherId));
    }

    /** 单个提交详情 */
    @GetMapping("/assignments/{id}/submissions/{sid}")
    public Result<AssignmentSubmission> getSubmission(@PathVariable Long id, @PathVariable Long sid) {
        Long teacherId = getCurrentUserId();
        return Result.ok(assignmentService.getSubmissionDetail(sid, teacherId));
    }

    /** 作业提交报告（谁交了谁没交） */
    @GetMapping("/assignments/{id}/report")
    public Result<Map<String, Object>> getReport(@PathVariable Long id) {
        Long teacherId = getCurrentUserId();
        return Result.ok(assignmentService.getAssignmentReport(id, teacherId));
    }

    /** 点评 */
    @PostMapping("/assignments/{id}/submissions/{sid}/review")
    public Result<Void> reviewSubmission(@PathVariable Long id,
                                          @PathVariable Long sid,
                                          @Valid @RequestBody ReviewSubmissionDTO dto) {
        Long teacherId = getCurrentUserId();
        log.info("作业点评: teacherId={}, submissionId={}", teacherId, sid);
        assignmentService.reviewSubmission(sid, dto, teacherId);
        return Result.ok(null);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}
