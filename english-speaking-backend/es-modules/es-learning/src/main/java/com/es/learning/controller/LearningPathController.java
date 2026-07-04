package com.es.learning.controller;

import com.es.common.dto.Result;
import com.es.learning.dto.LearningPathVO;
import com.es.learning.service.LearningPathService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/path")
public class LearningPathController {

    private final LearningPathService learningPathService;

    public LearningPathController(LearningPathService learningPathService) {
        this.learningPathService = learningPathService;
    }

    @GetMapping
    public Result<LearningPathVO> getPath() {
        Long userId = getCurrentUserId();
        return Result.ok(learningPathService.getPath(userId));
    }

    @PostMapping("/create")
    public Result<LearningPathVO> createPath(@RequestBody Map<String, String> body) {
        Long userId = getCurrentUserId();
        String pathType = body.getOrDefault("pathType", "daily");
        return Result.ok(learningPathService.createPath(userId, pathType));
    }

    @PostMapping("/task/{taskId}/complete")
    public Result<LearningPathVO> completeTask(@PathVariable Long taskId) {
        Long userId = getCurrentUserId();
        return Result.ok(learningPathService.completeTask(userId, taskId));
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long)) {
            throw new RuntimeException("未登录或认证已过期");
        }
        return (Long) auth.getPrincipal();
    }
}
