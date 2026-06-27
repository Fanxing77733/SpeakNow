package com.es.assessment.controller;

import com.es.assessment.dto.AssessmentResultVO;
import com.es.assessment.dto.QuestionVO;
import com.es.assessment.dto.SubmitAnswersDTO;
import com.es.assessment.service.AssessmentService;
import com.es.common.dto.Result;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 智能测评控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/assessment")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    /**
     * 获取固定测评题目（20 题，已过滤 correct_answer）
     */
    @GetMapping("/questions")
    public Result<List<QuestionVO>> getQuestions(@RequestParam(defaultValue = "fixed") String type) {
        log.info("获取测评题目: type={}", type);
        List<QuestionVO> questions = assessmentService.getFixedQuestions();
        return Result.ok(questions);
    }

    /**
     * 提交测评答案
     */
    @PostMapping("/submit")
    public Result<AssessmentResultVO> submit(@Valid @RequestBody SubmitAnswersDTO dto) {
        Long userId = getCurrentUserId();
        log.info("提交测评答案: userId={}, answerCount={}", userId, dto.getAnswers().size());
        AssessmentResultVO result = assessmentService.submitAnswers(userId, dto);
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
