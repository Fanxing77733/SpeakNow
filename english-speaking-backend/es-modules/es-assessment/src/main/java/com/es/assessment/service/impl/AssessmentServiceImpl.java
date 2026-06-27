package com.es.assessment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.assessment.dto.AssessmentResultVO;
import com.es.assessment.dto.QuestionVO;
import com.es.assessment.dto.SubmitAnswersDTO;
import com.es.assessment.entity.AssessmentQuestion;
import com.es.assessment.entity.AssessmentRecord;
import com.es.assessment.mapper.AssessmentQuestionMapper;
import com.es.assessment.mapper.AssessmentRecordMapper;
import com.es.assessment.service.AssessmentService;
import com.es.common.exception.BusinessException;
import com.es.user.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 智能测评业务逻辑实现
 */
@Slf4j
@Service
public class AssessmentServiceImpl implements AssessmentService {

    /** 每题分值 */
    private static final int POINTS_PER_QUESTION = 5;

    /** 每类题目数量 */
    private static final int QUESTIONS_PER_TYPE = 5;

    /** 期望总题数 */
    private static final int EXPECTED_TOTAL_QUESTIONS = 20;

    /** 题目类型列表 */
    private static final List<String> QUESTION_TYPES = List.of("vocab", "grammar", "reading", "listening");

    private final AssessmentQuestionMapper questionMapper;
    private final AssessmentRecordMapper recordMapper;
    private final UserService userService;

    public AssessmentServiceImpl(AssessmentQuestionMapper questionMapper,
                                 AssessmentRecordMapper recordMapper,
                                 UserService userService) {
        this.questionMapper = questionMapper;
        this.recordMapper = recordMapper;
        this.userService = userService;
    }

    @Override
    public List<QuestionVO> getFixedQuestions() {
        // 按类型各取 5 题，按 sort_order 排序
        List<AssessmentQuestion> allQuestions = new ArrayList<>();
        for (String type : QUESTION_TYPES) {
            List<AssessmentQuestion> questions = questionMapper.selectList(
                    new LambdaQueryWrapper<AssessmentQuestion>()
                            .eq(AssessmentQuestion::getType, type)
                            .orderByAsc(AssessmentQuestion::getSortOrder)
                            .last("LIMIT " + QUESTIONS_PER_TYPE)
            );
            allQuestions.addAll(questions);
            if (questions.size() < QUESTIONS_PER_TYPE) {
                log.warn("题库中 {} 类题目不足 {} 题，仅有 {} 题", type, QUESTIONS_PER_TYPE, questions.size());
            }
        }

        if (allQuestions.size() < EXPECTED_TOTAL_QUESTIONS) {
            throw new BusinessException(503, "题库维护中，请稍后再试");
        }

        // 白名单方式转换为 VO，绝不包含 correct_answer
        return allQuestions.stream()
                .map(this::toQuestionVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AssessmentResultVO submitAnswers(Long userId, SubmitAnswersDTO dto) {
        // 1. 查询全部 20 道题（需要 correct_answer 做判分）
        List<AssessmentQuestion> allQuestions = new ArrayList<>();
        for (String type : QUESTION_TYPES) {
            List<AssessmentQuestion> questions = questionMapper.selectList(
                    new LambdaQueryWrapper<AssessmentQuestion>()
                            .eq(AssessmentQuestion::getType, type)
                            .orderByAsc(AssessmentQuestion::getSortOrder)
                            .last("LIMIT " + QUESTIONS_PER_TYPE)
            );
            allQuestions.addAll(questions);
        }

        if (allQuestions.size() < EXPECTED_TOTAL_QUESTIONS) {
            throw new BusinessException(503, "题库维护中，请稍后再试");
        }

        // 2. 构建题目 ID -> 正确答案 的映射
        Map<Integer, String> answerMap = allQuestions.stream()
                .collect(Collectors.toMap(
                        AssessmentQuestion::getId,
                        AssessmentQuestion::getCorrectAnswer
                ));

        // 题目 ID -> 题目类型 的映射（用于分类计分）
        Map<Integer, String> typeMap = allQuestions.stream()
                .collect(Collectors.toMap(
                        AssessmentQuestion::getId,
                        AssessmentQuestion::getType
                ));

        // 3. 逐题比对（忽略用户伪造的额外字段，只取 questionId + selectedKey）
        int totalCorrect = 0;
        int vocabCorrect = 0;
        int grammarCorrect = 0;
        int readingCorrect = 0;
        int listeningCorrect = 0;

        List<Map<String, Object>> answerDetails = new ArrayList<>();

        for (SubmitAnswersDTO.AnswerItem item : dto.getAnswers()) {
            Integer qid = item.getQuestionId();
            String selected = item.getSelectedKey();
            String correct = answerMap.get(qid);

            boolean isCorrect = correct != null && correct.equals(selected);

            // 计入总数
            if (isCorrect) {
                totalCorrect++;

                // 按类型分类计分
                String type = typeMap.get(qid);
                if ("vocab".equals(type)) {
                    vocabCorrect++;
                } else if ("grammar".equals(type)) {
                    grammarCorrect++;
                } else if ("reading".equals(type)) {
                    readingCorrect++;
                } else if ("listening".equals(type)) {
                    listeningCorrect++;
                }
            }

            // 构建答题明细
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("questionId", qid);
            detail.put("userAnswer", selected);
            detail.put("isCorrect", isCorrect);
            answerDetails.add(detail);
        }

        // 4. 计算分数（每类满分 = 5 题 × 20 = 100，总分 = 正确题数 × 5 = 100）
        int totalScore = totalCorrect * POINTS_PER_QUESTION; // 0-100
        int vocabScore = vocabCorrect * (100 / QUESTIONS_PER_TYPE); // 0-100
        int grammarScore = grammarCorrect * (100 / QUESTIONS_PER_TYPE);
        int readingScore = readingCorrect * (100 / QUESTIONS_PER_TYPE);
        int listeningScore = listeningCorrect * (100 / QUESTIONS_PER_TYPE);

        // 5. 定级
        String resultLevel;
        String message;
        if (totalScore <= 40) {
            resultLevel = "beginner";
            message = "基础不错，建议从日常口语和基础语法开始系统学习，坚持每天练习！";
        } else if (totalScore <= 70) {
            resultLevel = "intermediate";
            message = "你有一定的英语基础，继续加强词汇和听力训练，多进行情景对话练习！";
        } else {
            resultLevel = "advanced";
            message = "你的英语水平很好！可以挑战更高级的商务英语和学术英语内容！";
        }

        // 6. 写入 assessment_records 表
        AssessmentRecord record = new AssessmentRecord();
        record.setUserId(userId);
        record.setAssessmentType("fixed");
        record.setTotalScore(totalScore);
        record.setVocabScore(vocabScore);
        record.setGrammarScore(grammarScore);
        record.setReadingScore(readingScore);
        record.setListeningScore(listeningScore);
        record.setResultLevel(resultLevel);
        record.setAnswersJson(toJsonString(answerDetails));
        record.setCreatedAt(LocalDateTime.now());
        recordMapper.insert(record);

        // 7. 更新 users 表的 level 字段
        userService.updateLevel(userId, resultLevel);

        log.info("测评完成: userId={}, totalScore={}, level={}, recordId={}",
                userId, totalScore, resultLevel, record.getId());

        // 8. 构建返回结果
        AssessmentResultVO vo = new AssessmentResultVO();
        vo.setRecordId(record.getId());
        vo.setTotalScore(totalScore);
        vo.setVocabScore(vocabScore);
        vo.setGrammarScore(grammarScore);
        vo.setReadingScore(readingScore);
        vo.setListeningScore(listeningScore);
        vo.setResultLevel(resultLevel);
        vo.setMessage(message);
        return vo;
    }

    // ======================== 私有方法 ========================

    /**
     * 白名单方式：新建 QuestionVO，只 set 允许的字段，绝不包含 correct_answer
     */
    private QuestionVO toQuestionVO(AssessmentQuestion entity) {
        QuestionVO vo = new QuestionVO();
        vo.setId(entity.getId());
        vo.setType(entity.getType());
        vo.setQuestionText(entity.getQuestionText());
        vo.setOptionsJson(entity.getOptionsJson());
        vo.setSortOrder(entity.getSortOrder());
        // 故意不 set correctAnswer —— 白名单过滤的核心
        return vo;
    }

    /**
     * 将 List<Map> 转成 JSON 字符串（简化实现，不引入 Jackson）
     */
    private String toJsonString(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            Map<String, Object> map = list.get(i);
            sb.append("{");
            int j = 0;
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                sb.append("\"").append(entry.getKey()).append("\":");
                Object value = entry.getValue();
                if (value instanceof String) {
                    sb.append("\"").append(value).append("\"");
                } else {
                    sb.append(value);
                }
                if (j < map.size() - 1) sb.append(",");
                j++;
            }
            sb.append("}");
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
