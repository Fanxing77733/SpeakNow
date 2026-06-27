package com.es.practice.controller;

import com.es.common.dto.Result;
import com.es.practice.dto.ContentSentenceVO;
import com.es.practice.dto.PronounceEvalResultVO;
import com.es.practice.service.PracticeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 口语训练控制器 — 发音跟读评测相关接口
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/eval")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    /**
     * 获取跟读内容列表
     * @param difficulty 难度筛选（可选）: beginner / intermediate / advanced
     */
    @GetMapping("/content")
    public Result<List<ContentSentenceVO>> getContentList(
            @RequestParam(required = false) String difficulty) {
        log.info("获取跟读内容: difficulty={}", difficulty);
        List<ContentSentenceVO> list = practiceService.getContentList(difficulty);
        return Result.ok(list);
    }

    /**
     * 发音跟读评测
     * @param audio           音频文件（multipart/form-data）
     * @param contentId       跟读内容 ID
     * @param durationSeconds 前端传入的实际录音时长（秒），可选，不传则回退到 WAV 头部解析
     */
    @PostMapping("/pronounce")
    public Result<PronounceEvalResultVO> evaluate(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("contentId") Integer contentId,
            @RequestParam(value = "duration", required = false) Double durationSeconds) {
        Long userId = getCurrentUserId();
        log.info("发音评测请求: userId={}, contentId={}, audioSize={}, duration={}s",
                userId, contentId, audio != null ? audio.getSize() : 0, durationSeconds);
        PronounceEvalResultVO result = practiceService.evaluate(userId, audio, contentId, durationSeconds);
        return Result.ok(result);
    }

    /**
     * 查询评测记录详情
     * @param recordId 评测记录 ID
     */
    @GetMapping("/result/{recordId}")
    public Result<PronounceEvalResultVO> getResult(@PathVariable Long recordId) {
        Long userId = getCurrentUserId();
        log.info("查询评测记录: userId={}, recordId={}", userId, recordId);
        PronounceEvalResultVO result = practiceService.getResult(userId, recordId);
        return Result.ok(result);
    }

    /**
     * 从 SecurityContext 获取当前登录用户 ID
     */
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        throw new RuntimeException("未获取到登录用户信息");
    }
}
