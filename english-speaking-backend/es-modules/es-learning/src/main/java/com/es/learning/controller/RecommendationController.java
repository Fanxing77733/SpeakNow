package com.es.learning.controller;

import com.es.common.dto.Result;
import com.es.learning.service.RecommendationService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/recommend")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/sentences")
    public Result<List<Map<String, Object>>> recommendSentences() {
        return Result.ok(recommendationService.recommendSentences(getCurrentUserId()));
    }

    @GetMapping("/scenes")
    public Result<List<Map<String, String>>> recommendScenes() {
        return Result.ok(recommendationService.recommendScenes(getCurrentUserId()));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long id) return id;
        throw new RuntimeException("未登录");
    }
}
