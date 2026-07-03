package com.es.admin.controller.teacher;

import com.es.admin.dto.ClassCreateDTO;
import com.es.admin.entity.ClassInfo;
import com.es.admin.service.ClassService;
import com.es.common.dto.Result;
import com.es.user.dto.UserVO;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/teacher")
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    /** 我的班级列表 */
    @GetMapping("/classes")
    public Result<List<ClassInfo>> getMyClasses() {
        Long teacherId = getCurrentUserId();
        return Result.ok(classService.getMyClasses(teacherId));
    }

    /** 班级详情 */
    @GetMapping("/classes/{id}")
    public Result<ClassInfo> getClassDetail(@PathVariable Long id) {
        Long teacherId = getCurrentUserId();
        return Result.ok(classService.getClassDetail(id, teacherId));
    }

    /** 创建班级 */
    @PostMapping("/classes")
    public Result<ClassInfo> createClass(@Valid @RequestBody ClassCreateDTO dto) {
        Long teacherId = getCurrentUserId();
        log.info("创建班级: teacherId={}, name={}", teacherId, dto.getName());
        return Result.ok(classService.createClass(teacherId, dto));
    }

    /** 编辑班级 */
    @PutMapping("/classes/{id}")
    public Result<Void> updateClass(@PathVariable Long id, @Valid @RequestBody ClassCreateDTO dto) {
        Long teacherId = getCurrentUserId();
        classService.updateClass(id, dto, teacherId);
        return Result.ok(null);
    }

    /** 解散班级 */
    @DeleteMapping("/classes/{id}")
    public Result<Void> disbandClass(@PathVariable Long id) {
        Long teacherId = getCurrentUserId();
        classService.disbandClass(id, teacherId);
        return Result.ok(null);
    }

    /** 重新生成邀请码 */
    @PostMapping("/classes/{id}/code")
    public Result<String> regenerateCode(@PathVariable Long id) {
        Long teacherId = getCurrentUserId();
        String code = classService.regenerateCode(id, teacherId);
        return Result.ok(code);
    }

    /** 班级学生列表 */
    @GetMapping("/classes/{id}/students")
    public Result<List<UserVO>> getStudents(@PathVariable Long id) {
        Long teacherId = getCurrentUserId();
        return Result.ok(classService.getClassStudents(id, teacherId));
    }

    /** 移除学生 */
    @DeleteMapping("/classes/{id}/students/{sid}")
    public Result<Void> removeStudent(@PathVariable Long id, @PathVariable Long sid) {
        Long teacherId = getCurrentUserId();
        classService.removeStudent(id, sid, teacherId);
        return Result.ok(null);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}
