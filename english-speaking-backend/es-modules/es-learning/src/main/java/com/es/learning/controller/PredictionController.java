package com.es.learning.controller;

import com.es.common.dto.Result;
import com.es.learning.service.PredictionService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/prediction")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping("/alert")
    public Result<Map<String, Object>> getAlert() {
        return Result.ok(predictionService.getAlert(getCurrentUserId()));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long id) return id;
        throw new RuntimeException("未登录");
    }
}
