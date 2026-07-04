package com.es.practice.controller;

import com.es.common.dto.Result;
import com.es.practice.dto.RoleplayHistoryVO;
import com.es.practice.dto.RoleplaySceneVO;
import com.es.practice.service.RoleplaySceneService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/roleplay")
public class RoleplayController {

    private final RoleplaySceneService roleplaySceneService;

    public RoleplayController(RoleplaySceneService roleplaySceneService) {
        this.roleplaySceneService = roleplaySceneService;
    }

    /** 获取角色扮演场景列表（支持按难度过滤） */
    @GetMapping("/scenes")
    public Result<List<RoleplaySceneVO>> listScenes(
            @RequestParam(required = false) String difficulty) {
        List<RoleplaySceneVO> scenes = roleplaySceneService.listScenes(difficulty);
        return Result.ok(scenes);
    }

    /** 获取角色扮演历史记录（分页） */
    @GetMapping("/history")
    public Result<Map<String, Object>> getHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId();
        List<RoleplayHistoryVO> records = roleplaySceneService.getHistory(userId, page, size);
        long total = roleplaySceneService.countHistory(userId);
        return Result.ok(Map.of(
                "total", total,
                "pages", (int) Math.ceil((double) total / size),
                "current", page,
                "records", records
        ));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        throw new RuntimeException("未获取到登录用户信息");
    }
}
