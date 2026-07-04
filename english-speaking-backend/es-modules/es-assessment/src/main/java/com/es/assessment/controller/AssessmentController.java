package com.es.assessment.controller;

import com.es.assessment.dto.AssessmentResultVO;
import com.es.assessment.dto.QuestionVO;
import com.es.assessment.dto.SubmitAnswersDTO;
import com.es.assessment.entity.AssessmentQuestion;
import com.es.assessment.entity.AssessmentRecord;
import com.es.assessment.mapper.AssessmentQuestionMapper;
import com.es.assessment.mapper.AssessmentRecordMapper;
import com.es.assessment.service.AssessmentService;
import com.es.common.dto.Result;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 智能测评控制器
 *
 * V1.0: 固定测评（GET /questions + POST /submit）— 30题从数据库随机抽取
 * V2.0: 自适应测评（GET /adaptive/start + POST /adaptive/answer）— 基于 IRT 算法逐题调整难度
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/assessment")
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final AssessmentQuestionMapper questionMapper;
    private final AssessmentRecordMapper recordMapper;

    public AssessmentController(AssessmentService assessmentService,
                                AssessmentQuestionMapper questionMapper,
                                AssessmentRecordMapper recordMapper) {
        this.assessmentService = assessmentService;
        this.questionMapper = questionMapper;
        this.recordMapper = recordMapper;
    }

    /** 获取固定测评题目（30题，随机抽取，已过滤 correct_answer） */
    @GetMapping("/questions")
    public Result<List<QuestionVO>> getQuestions(@RequestParam(defaultValue = "fixed") String type) {
        log.info("获取测评题目: type={}", type);
        List<QuestionVO> questions = assessmentService.getFixedQuestions();
        return Result.ok(questions);
    }

    /** 提交测评答案 */
    @PostMapping("/submit")
    public Result<AssessmentResultVO> submit(@Valid @RequestBody SubmitAnswersDTO dto) {
        Long userId = getCurrentUserId();
        log.info("提交测评答案: userId={}, answerCount={}", userId, dto.getAnswers().size());
        AssessmentResultVO result = assessmentService.submitAnswers(userId, dto);
        return Result.ok(result);
    }

    // ==================== V2.0 自适应测评（基于数据库真实题目） ====================

    private final Map<Long, AdaptiveSession> adaptiveSessions = new HashMap<>();

    /** 开始自适应测评：从题库中随机选取一道中等难度的题目作为首题 */
    @GetMapping("/adaptive/start")
    public Result<Map<String, Object>> startAdaptive() {
        Long userId = getCurrentUserId();

        // 获取全部题库
        List<AssessmentQuestion> allQuestions = questionMapper.selectList(null);
        if (allQuestions.isEmpty()) {
            return Result.fail(503, "题库维护中，请稍后再试");
        }

        // 随机选一题作为首题
        List<AssessmentQuestion> pool = new ArrayList<>(allQuestions);
        Collections.shuffle(pool, new Random(System.nanoTime()));

        // 优先选中等难度 (B1 左右)
        AssessmentQuestion firstQ = pool.stream()
                .filter(q -> "B1".equals(q.getCefrLevel()))
                .findFirst()
                .orElse(pool.get(0));

        AdaptiveSession session = new AdaptiveSession();
        session.abilityTheta = 0.0;
        session.questionCount = 0;
        session.difficultySum = 0.0;
        session.usedIds = new HashSet<>();
        session.allQuestions = allQuestions;
        session.answers = new ArrayList<>();
        session.typeScores = new HashMap<>();
        session.typeScores.put("vocab", new int[]{0, 0});
        session.typeScores.put("grammar", new int[]{0, 0});
        session.typeScores.put("reading", new int[]{0, 0});
        session.typeScores.put("listening", new int[]{0, 0});
        adaptiveSessions.put(userId, session);

        session.usedIds.add(firstQ.getId());

        Map<String, Object> question = buildQuestionMap(firstQ, session.questionCount + 1);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionActive", true);
        result.put("questionCount", 1);
        result.put("estimatedLevel", mapCefr(session.abilityTheta));
        result.put("question", question);
        return Result.ok(result);
    }

    /** 提交自适应测评单题答案，返回下一题或最终结果 */
    @PostMapping("/adaptive/answer")
    public Result<Map<String, Object>> answerAdaptive(@RequestBody Map<String, Object> body) {
        Long userId = getCurrentUserId();
        AdaptiveSession session = adaptiveSessions.get(userId);
        if (session == null) return Result.fail(404, "会话已过期，请重新开始测评");

        int questionId = body.get("questionId") instanceof Number
                ? ((Number) body.get("questionId")).intValue() : 0;
        String selectedKey = String.valueOf(body.getOrDefault("selectedKey", ""));

        // 从题库中找到这道题，判断对错
        AssessmentQuestion currentQ = session.allQuestions.stream()
                .filter(q -> q.getId() == questionId)
                .findFirst()
                .orElse(null);

        boolean correct = currentQ != null && selectedKey.equals(currentQ.getCorrectAnswer());

        // 更新 IRT 能力值
        session.questionCount++;
        session.difficultySum += currentQ != null ? currentQ.getDifficulty().doubleValue() : 1.0;

        // IRT 更新：答对 theta 上升，答错下降，幅度与难度相关
        double itemDifficulty = currentQ != null ? currentQ.getDifficulty().doubleValue() : 1.0;
        double discrimination = 1.0;
        double p = 1.0 / (1.0 + Math.exp(-discrimination * (session.abilityTheta - itemDifficulty)));
        session.abilityTheta += 0.5 * ((correct ? 1.0 : 0.0) - p);

        // 记录答题
        session.answers.add(Map.of("questionId", questionId, "selectedKey", selectedKey, "correct", correct));

        // 分类统计
        if (currentQ != null) {
            int[] scores = session.typeScores.getOrDefault(currentQ.getType(), new int[]{0, 0});
            scores[1]++;
            if (correct) scores[0]++;
            session.typeScores.put(currentQ.getType(), scores);
        }

        // 收敛判断：15题以上且能力值变化 < 0.15
        boolean converged = session.questionCount >= 15
                && Math.abs(session.abilityTheta - session.lastTheta) < 0.15;
        session.lastTheta = session.abilityTheta;

        int maxQuestions = 30;
        if (converged || session.questionCount >= maxQuestions) {
            return finishAdaptive(userId, session);
        }

        // 选取下一题：根据当前 theta 选难度最接近的题目
        AssessmentQuestion nextQ = selectNextQuestion(session);
        if (nextQ == null) {
            return finishAdaptive(userId, session);
        }

        session.usedIds.add(nextQ.getId());
        Map<String, Object> next = buildQuestionMap(nextQ, session.questionCount + 1);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionActive", true);
        result.put("questionCount", session.questionCount + 1);
        result.put("estimatedLevel", mapCefr(session.abilityTheta));
        result.put("converged", false);
        result.put("question", next);
        return Result.ok(result);
    }

    /** 根据当前能力值 selected 下一道未使用的题目 */
    private AssessmentQuestion selectNextQuestion(AdaptiveSession session) {
        List<AssessmentQuestion> candidates = session.allQuestions.stream()
                .filter(q -> !session.usedIds.contains(q.getId()))
                .collect(Collectors.toList());

        if (candidates.isEmpty()) return null;

        // 选难度最接近 theta+1.0 的题目（略高于当前能力的挑战题）
        double targetDiff = session.abilityTheta + 1.0;
        candidates.sort(Comparator.comparingDouble(
                q -> Math.abs(q.getDifficulty().doubleValue() - targetDiff)));
        return candidates.get(0);
    }

    /** 完成自适应测评，持久化结果 */
    private Result<Map<String, Object>> finishAdaptive(Long userId, AdaptiveSession session) {
        adaptiveSessions.remove(userId);
        String cefr = mapCefr(session.abilityTheta);

        // 计算各维度得分
        int[] vocab = session.typeScores.getOrDefault("vocab", new int[]{0, 0});
        int[] grammar = session.typeScores.getOrDefault("grammar", new int[]{0, 0});
        int[] reading = session.typeScores.getOrDefault("reading", new int[]{0, 0});
        int[] listening = session.typeScores.getOrDefault("listening", new int[]{0, 0});

        int vocabScore = vocab[1] > 0 ? (int) Math.round(vocab[0] * 100.0 / vocab[1]) : 0;
        int grammarScore = grammar[1] > 0 ? (int) Math.round(grammar[0] * 100.0 / grammar[1]) : 0;
        int readingScore = reading[1] > 0 ? (int) Math.round(reading[0] * 100.0 / reading[1]) : 0;
        int listeningScore = listening[1] > 0 ? (int) Math.round(listening[0] * 100.0 / listening[1]) : 0;

        int totalCorrect = (int) session.answers.stream().filter(a -> (boolean) a.get("correct")).count();
        int totalScore = session.questionCount > 0
                ? (int) Math.round(totalCorrect * 100.0 / session.questionCount) : 0;

        // 持久化到数据库
        AssessmentRecord record = new AssessmentRecord();
        record.setUserId(userId);
        record.setAssessmentType("adaptive");
        record.setTotalScore(totalScore);
        record.setVocabScore(vocabScore);
        record.setGrammarScore(grammarScore);
        record.setReadingScore(readingScore);
        record.setListeningScore(listeningScore);
        record.setResultLevel(cefr);
        record.setCefrLevel(cefr);
        record.setAnswersJson(buildAnswersJson(session.answers));
        record.setAbilityTheta(BigDecimal.valueOf(session.abilityTheta));
        record.setCreatedAt(LocalDateTime.now());
        recordMapper.insert(record);

        log.info("自适应测评完成: userId={}, totalScore={}, cefr={}, questions={}",
                userId, totalScore, cefr, session.questionCount);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("completed", true);
        result.put("recordId", record.getId());
        result.put("totalQuestions", session.questionCount);
        result.put("totalScore", totalScore);
        result.put("correctCount", totalCorrect);
        result.put("cefrLevel", cefr);
        result.put("abilityTheta", String.format("%.4f", session.abilityTheta));
        result.put("vocabScore", vocabScore);
        result.put("grammarScore", grammarScore);
        result.put("readingScore", readingScore);
        result.put("listeningScore", listeningScore);
        result.put("radarData", Arrays.asList(
                Map.of("dimension", "词汇", "score", vocabScore, "fullMark", 100),
                Map.of("dimension", "语法", "score", grammarScore, "fullMark", 100),
                Map.of("dimension", "阅读", "score", readingScore, "fullMark", 100),
                Map.of("dimension", "听力", "score", listeningScore, "fullMark", 100)
        ));
        result.put("suggestion", getStudySuggestion(cefr));
        return Result.ok(result);
    }

    /** 构建返回给前端的题目（白名单过滤，绝不包含 correctAnswer） */
    private Map<String, Object> buildQuestionMap(AssessmentQuestion q, int questionNum) {
        Map<String, Object> question = new LinkedHashMap<>();
        question.put("id", q.getId());
        question.put("type", q.getType());
        question.put("questionText", q.getQuestionText());
        question.put("transcript", q.getTranscript());
        question.put("difficulty", q.getDifficulty().doubleValue());
        question.put("optionsJson", q.getOptionsJson());

        // 同时提供解析好的 options Map（兼容自适应前端）
        Map<String, String> optionsMap = parseOptionsToMap(q.getOptionsJson());
        question.put("options", optionsMap);

        return question;
    }

    /** 解析 options_json 为 key->text Map */
    private Map<String, String> parseOptionsToMap(String optionsJson) {
        Map<String, String> result = new LinkedHashMap<>();
        if (optionsJson == null || optionsJson.isBlank()) return result;

        // 简单 JSON 数组解析：匹配 {"key":"A","text":"xxx"} 模式
        String[] parts = optionsJson.split("\\},\\s*\\{");
        for (String part : parts) {
            String cleaned = part.replaceAll("[\\[\\]{}]", "").trim();
            String keyStr = extractJsonValue(cleaned, "key");
            String textStr = extractJsonValue(cleaned, "text");
            if (keyStr != null && textStr != null) {
                result.put(keyStr, textStr);
            }
        }
        return result;
    }

    /** 从 JSON 片段中提取指定 key 的值 */
    private String extractJsonValue(String text, String key) {
        String pattern = "\"" + key + "\"\\s*:\\s*\"";
        int startIdx = text.indexOf(pattern);
        if (startIdx == -1) return null;
        startIdx += pattern.length();
        int endIdx = text.indexOf("\"", startIdx);
        if (endIdx == -1) return null;
        return text.substring(startIdx, endIdx);
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
            case "A1" -> "你的英语正在起步阶段！建议从最基础的词汇和句型开始，每天坚持听英语儿歌、看简单动画，培养语感。";
            case "A2" -> "你的英语处于初级水平！能够理解简单的日常表达。建议从基础词汇、常用句型和听力训练开始，坚持每天练习。";
            case "B1" -> "你的英语处于中级水平！能够应对日常生活中的大部分场景。建议系统学习语法知识，扩大词汇量，多进行情景对话练习。";
            case "B2" -> "你的英语处于中高级水平！能够理解复杂文章的主旨。建议加强学术词汇和专业领域的听说训练。";
            case "C1" -> "你的英语已达到高级水平！能够流利表达观点。建议多阅读原版书籍和学术论文，进一步提升专业表达能力。";
            default -> "你的英语已达到精通水平！能够轻松理解几乎所有内容。建议挑战学术写作和同声传译等高级技能。";
        };
    }

    private String buildAnswersJson(List<Map<String, Object>> answers) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < answers.size(); i++) {
            Map<String, Object> a = answers.get(i);
            sb.append("{\"questionId\":").append(a.get("questionId"))
              .append(",\"userAnswer\":\"").append(a.get("selectedKey"))
              .append("\",\"isCorrect\":").append(a.get("correct")).append("}");
            if (i < answers.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    /** 自适应测评会话 */
    static class AdaptiveSession {
        double abilityTheta;
        double lastTheta = Double.MAX_VALUE;
        double difficultySum;
        int questionCount;
        Set<Integer> usedIds;
        List<AssessmentQuestion> allQuestions;
        List<Map<String, Object>> answers;
        Map<String, int[]> typeScores; // type -> [correct, total]
    }

    /** 从 SecurityContext 获取当前登录用户 ID */
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        throw new RuntimeException("未获取到登录用户信息");
    }
}
