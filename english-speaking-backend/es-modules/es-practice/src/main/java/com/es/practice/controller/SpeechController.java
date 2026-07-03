package com.es.practice.controller;

import com.es.common.dto.Result;
import com.es.common.exception.BusinessException;
import com.es.practice.dto.SpeechEvalResultVO;
import com.es.practice.dto.SpeechTopicVO;
import com.es.practice.service.SpeechService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/speech")
public class SpeechController {

    private static final int MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_DURATION_SECONDS = 120;

    private final SpeechService speechService;

    public SpeechController(SpeechService speechService) {
        this.speechService = speechService;
    }

    /** 获取话题列表 */
    @GetMapping("/topics")
    public Result<List<SpeechTopicVO>> getTopics(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty) {
        List<SpeechTopicVO> list = speechService.getTopics(category, difficulty);
        return Result.ok(list);
    }

    /** 获取话题详情 */
    @GetMapping("/topics/{id}")
    public Result<SpeechTopicVO> getTopicDetail(@PathVariable Integer id) {
        SpeechTopicVO detail = speechService.getTopicDetail(id);
        return Result.ok(detail);
    }

    /** 开始陈述 */
    @PostMapping("/start")
    public Result<Long> startSpeech(@RequestParam Integer topicId) {
        Long userId = getCurrentUserId();
        Long sessionId = speechService.startSpeech(userId, topicId);
        return Result.ok(sessionId);
    }

    /** 提交录音 */
    @PostMapping("/{sessionId}/submit")
    public Result<SpeechEvalResultVO> submitSpeech(
            @PathVariable Long sessionId,
            @RequestParam("audio") MultipartFile audio,
            @RequestParam(defaultValue = "0") int durationSeconds) {
        Long userId = getCurrentUserId();

        if (audio.isEmpty()) {
            throw new BusinessException(400, "未检测到有效语音，请重新朗读");
        }
        if (audio.getSize() > MAX_AUDIO_SIZE) {
            throw new BusinessException(400, "录音文件过大，请缩短录音时间后重试");
        }
        if (durationSeconds > MAX_DURATION_SECONDS) {
            throw new BusinessException(400, "录音时长超过限制，已自动截断");
        }

        byte[] audioBytes;
        try {
            audioBytes = audio.getBytes();
        } catch (IOException e) {
            throw new BusinessException(400, "音频读取失败");
        }

        SpeechEvalResultVO result = speechService.submitSpeech(userId, sessionId, audioBytes, durationSeconds);
        return Result.ok(result);
    }

    /** 获取评估结果 */
    @GetMapping("/{sessionId}/result")
    public Result<SpeechEvalResultVO> getResult(@PathVariable Long sessionId) {
        SpeechEvalResultVO result = speechService.getResult(sessionId);
        return Result.ok(result);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}
