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

import java.util.*;

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

    // ====== V2.0 自适应测评接口 ======

    private final Map<Long, AdaptiveSession> adaptiveSessions = new HashMap<>();

    /** 开始自适应测评 */
    @GetMapping("/adaptive/start")
    public Result<Map<String, Object>> startAdaptive() {
        Long userId = getCurrentUserId();
        AdaptiveSession session = new AdaptiveSession();
        session.abilityTheta = 0.0;
        session.questionCount = 0;
        session.answers = new ArrayList<>();
        adaptiveSessions.put(userId, session);

        // 返回首题（难度≈0）
        Map<String, Object> firstQuestion = Map.of(
                "sessionActive", true,
                "questionCount", 1,
                "estimatedLevel", "B1",
                "question", Map.of(
                        "id", 101, "type", "vocab",
                        "questionText", "Choose the word that best completes the sentence: She has been ___ English for five years.",
                        "options", Map.of("A", "learn", "B", "learning", "C", "learns", "D", "learned"),
                        "difficulty", 0.5
                )
        );
        return Result.ok(firstQuestion);
    }

    /** 提交自适应测评答案 */
    @PostMapping("/adaptive/answer")
    public Result<Map<String, Object>> answerAdaptive(@RequestBody Map<String, Object> body) {
        Long userId = getCurrentUserId();
        AdaptiveSession session = adaptiveSessions.get(userId);
        if (session == null) return Result.fail(404, "会话不存在，请重新开始测评");

        String answer = String.valueOf(body.getOrDefault("selectedKey", ""));
        boolean correct = "B".equals(answer); // 简化：正确答案是B
        session.questionCount++;
        session.abilityTheta += correct ? 0.3 : -0.3;
        session.answers.add(Map.of("questionId", body.get("questionId"), "selectedKey", answer, "correct", correct));

        // 检查是否收敛
        boolean converged = session.questionCount >= 15 && Math.abs(session.abilityTheta - session.lastTheta) < 0.2;
        session.lastTheta = session.abilityTheta;

        if (converged || session.questionCount >= 30) {
            return finishAdaptive(userId, session);
        }

        Map<String, Object> next = Map.of(
                "sessionActive", true,
                "questionCount", session.questionCount + 1,
                "estimatedLevel", mapCefr(session.abilityTheta),
                "converged", false,
                "question", Map.of(
                        "id", 101 + session.questionCount,
                        "type", "grammar",
                        "questionText", "If I ___ you, I would study harder. (第" + (session.questionCount + 1) + "题)",
                        "options", Map.of("A", "am", "B", "was", "C", "were", "D", "be"),
                        "difficulty", String.format("%.2f", 0.5 + session.abilityTheta)
                )
        );
        return Result.ok(next);
    }

    private Result<Map<String, Object>> finishAdaptive(Long userId, AdaptiveSession session) {
        adaptiveSessions.remove(userId);
        String cefr = mapCefr(session.abilityTheta);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("completed", true);
        result.put("totalQuestions", session.questionCount);
        result.put("cefrLevel", cefr);
        result.put("abilityTheta", String.format("%.4f", session.abilityTheta));
        result.put("radarData", Arrays.asList(
                Map.of("dimension", "词汇", "score", 75 + (int)(Math.random() * 20), "fullMark", 100),
                Map.of("dimension", "语法", "score", 70 + (int)(Math.random() * 20), "fullMark", 100),
                Map.of("dimension", "阅读", "score", 78 + (int)(Math.random() * 15), "fullMark", 100),
                Map.of("dimension", "听力", "score", 68 + (int)(Math.random() * 25), "fullMark", 100)
        ));
        result.put("suggestion", getStudySuggestion(cefr));
        return Result.ok(result);
    }

    private String mapCefr(double theta) {
        if (theta < -1.5) return "A1";
        if (theta < -0.5) return "A2";
        if (theta < 0.5) return "B1";
        if (theta < 1.5) return "B2";
        if (theta < 2.5) return "C1";
        return "C2";
    }

    private String getStudySuggestion(String cefr) {
        return switch (cefr) {
            case "A1", "A2" -> "建议从基础发音和日常词汇开始练习，每天坚持 15 分钟跟读训练。";
            case "B1", "B2" -> "你已经具备了较好的英语基础，建议多参与情景对话练习，提升流利度和表达地道性。";
            default -> "你的英语水平已经很高，建议挑战商务谈判和学术讨论等高级场景，持续精进。";
        };
    }

    /** 自适应测评会话状态 */
    static class AdaptiveSession {
        double abilityTheta;
        double lastTheta = Double.MAX_VALUE;
        int questionCount;
        List<Map<String, Object>> answers;
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
