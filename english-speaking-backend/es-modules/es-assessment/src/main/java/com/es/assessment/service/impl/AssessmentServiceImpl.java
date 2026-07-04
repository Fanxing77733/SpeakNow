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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 智能测评业务逻辑实现（V3.0）
 *
 * 从 50 题池中随机抽取 30 题：听力10 + 词汇7 + 语法7 + 阅读6
 * CEFR 六级评定：A1/A2/B1/B2/C1/C2
 */
@Slf4j
@Service
public class AssessmentServiceImpl implements AssessmentService {

    /** 题目分布 */
    private static final int LISTENING_COUNT = 10;
    private static final int VOCAB_COUNT = 7;
    private static final int GRAMMAR_COUNT = 7;
    private static final int READING_COUNT = 6;
    private static final int TOTAL_QUESTIONS = 30;

    /** 每题分值（满分 100） */
    private static final double POINTS_PER_QUESTION = 100.0 / TOTAL_QUESTIONS;

    private final AssessmentQuestionMapper questionMapper;
    private final AssessmentRecordMapper recordMapper;

    public AssessmentServiceImpl(AssessmentQuestionMapper questionMapper,
                                 AssessmentRecordMapper recordMapper) {
        this.questionMapper = questionMapper;
        this.recordMapper = recordMapper;
    }

    @Override
    public List<QuestionVO> getFixedQuestions() {
        // 1. 获取全部题目
        List<AssessmentQuestion> allQuestions = questionMapper.selectList(
                new LambdaQueryWrapper<AssessmentQuestion>()
                        .orderByAsc(AssessmentQuestion::getSortOrder)
        );

        // 2. 按类型分组
        Map<String, List<AssessmentQuestion>> grouped = allQuestions.stream()
                .collect(Collectors.groupingBy(AssessmentQuestion::getType));

        List<AssessmentQuestion> listeningPool = grouped.getOrDefault("listening", Collections.emptyList());
        List<AssessmentQuestion> vocabPool = grouped.getOrDefault("vocab", Collections.emptyList());
        List<AssessmentQuestion> grammarPool = grouped.getOrDefault("grammar", Collections.emptyList());
        List<AssessmentQuestion> readingPool = grouped.getOrDefault("reading", Collections.emptyList());

        // 3. 校验题库是否充足
        if (listeningPool.size() < LISTENING_COUNT
                || vocabPool.size() < VOCAB_COUNT
                || grammarPool.size() < GRAMMAR_COUNT
                || readingPool.size() < READING_COUNT) {
            log.error("题库不足: listening={}, vocab={}, grammar={}, reading={}",
                    listeningPool.size(), vocabPool.size(), grammarPool.size(), readingPool.size());
            throw new BusinessException(503, "题库维护中，请稍后再试");
        }

        // 4. 随机抽取
        List<AssessmentQuestion> selected = new ArrayList<>();
        shuffleAndAdd(selected, listeningPool, LISTENING_COUNT);
        shuffleAndAdd(selected, vocabPool, VOCAB_COUNT);
        shuffleAndAdd(selected, grammarPool, GRAMMAR_COUNT);
        shuffleAndAdd(selected, readingPool, READING_COUNT);

        // 5. 打乱顺序（确保题型混合出现）
        Collections.shuffle(selected, new Random(System.nanoTime()));

        // 6. 返回前 30 题（白名单过滤）
        return selected.stream()
                .map(this::toQuestionVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AssessmentResultVO submitAnswers(Long userId, SubmitAnswersDTO dto) {
        // 1. 获取用户作答的题目 ID 列表
        List<Integer> questionIds = dto.getAnswers().stream()
                .map(SubmitAnswersDTO.AnswerItem::getQuestionId)
                .collect(Collectors.toList());

        if (questionIds.isEmpty()) {
            throw new BusinessException(400, "答案数据有误，请重新开始测评");
        }

        // 2. 查询对应题目
        List<AssessmentQuestion> questions = questionMapper.selectBatchIds(questionIds);
        if (questions.isEmpty()) {
            throw new BusinessException(503, "题库维护中，请稍后再试");
        }

        // 3. 构建 ID -> 题目 映射
        Map<Integer, AssessmentQuestion> questionMap = questions.stream()
                .collect(Collectors.toMap(AssessmentQuestion::getId, q -> q));

        // 4. 逐题判分
        int totalCorrect = 0;
        int vocabCorrect = 0, vocabTotal = 0;
        int grammarCorrect = 0, grammarTotal = 0;
        int readingCorrect = 0, readingTotal = 0;
        int listeningCorrect = 0, listeningTotal = 0;

        List<Map<String, Object>> answerDetails = new ArrayList<>();

        for (SubmitAnswersDTO.AnswerItem item : dto.getAnswers()) {
            Integer qid = item.getQuestionId();
            String selected = item.getSelectedKey();
            AssessmentQuestion question = questionMap.get(qid);

            if (question == null) continue;

            String correct = question.getCorrectAnswer();
            boolean isCorrect = correct != null && correct.equals(selected);

            if (isCorrect) totalCorrect++;

            // 按类型分类统计
            String type = question.getType();
            switch (type) {
                case "vocab" -> { vocabTotal++; if (isCorrect) vocabCorrect++; }
                case "grammar" -> { grammarTotal++; if (isCorrect) grammarCorrect++; }
                case "reading" -> { readingTotal++; if (isCorrect) readingCorrect++; }
                case "listening" -> { listeningTotal++; if (isCorrect) listeningCorrect++; }
            }

            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("questionId", qid);
            detail.put("userAnswer", selected);
            detail.put("isCorrect", isCorrect);
            answerDetails.add(detail);
        }

        // 5. 计算各维度百分制得分
        int totalScore = (int) Math.round(totalCorrect * POINTS_PER_QUESTION);
        int vocabScore = vocabTotal > 0 ? (int) Math.round(vocabCorrect * 100.0 / vocabTotal) : 0;
        int grammarScore = grammarTotal > 0 ? (int) Math.round(grammarCorrect * 100.0 / grammarTotal) : 0;
        int readingScore = readingTotal > 0 ? (int) Math.round(readingCorrect * 100.0 / readingTotal) : 0;
        int listeningScore = listeningTotal > 0 ? (int) Math.round(listeningCorrect * 100.0 / listeningTotal) : 0;

        // 6. CEFR 六级评定
        CefrResult cefr = evaluateCefr(totalScore, listeningScore, vocabScore, grammarScore, readingScore);

        // 7. 写入记录
        AssessmentRecord record = new AssessmentRecord();
        record.setUserId(userId);
        record.setAssessmentType("fixed");
        record.setTotalScore(totalScore);
        record.setVocabScore(vocabScore);
        record.setGrammarScore(grammarScore);
        record.setReadingScore(readingScore);
        record.setListeningScore(listeningScore);
        record.setResultLevel(cefr.level);
        record.setCefrLevel(cefr.level);
        record.setAnswersJson(toJsonString(answerDetails));
        record.setCreatedAt(LocalDateTime.now());
        recordMapper.insert(record);

        log.info("测评完成: userId={}, totalScore={}, cefr={}, recordId={}",
                userId, totalScore, cefr.level, record.getId());

        // 8. 构建返回结果
        AssessmentResultVO vo = new AssessmentResultVO();
        vo.setRecordId(record.getId());
        vo.setTotalScore(totalScore);
        vo.setVocabScore(vocabScore);
        vo.setGrammarScore(grammarScore);
        vo.setReadingScore(readingScore);
        vo.setListeningScore(listeningScore);
        vo.setCefrLevel(cefr.level);
        vo.setLevelLabel(cefr.label);
        vo.setMessage(cefr.message);
        vo.setCorrectCount(totalCorrect);
        vo.setTotalQuestions(dto.getAnswers().size());
        return vo;
    }

    // ======================== 私有方法 ========================

    /** 从池中随机抽取 count 条并加入目标列表 */
    private void shuffleAndAdd(List<AssessmentQuestion> target, List<AssessmentQuestion> pool, int count) {
        List<AssessmentQuestion> copy = new ArrayList<>(pool);
        Collections.shuffle(copy, new Random(System.nanoTime()));
        target.addAll(copy.subList(0, Math.min(count, copy.size())));
    }

    /** CEFR 六级评定 */
    private CefrResult evaluateCefr(int totalScore, int listeningScore,
                                     int vocabScore, int grammarScore, int readingScore) {
        // 加权综合：听力 30% + 词汇 23% + 语法 23% + 阅读 23%
        double weighted = listeningScore * 0.30 + vocabScore * 0.23
                        + grammarScore * 0.23 + readingScore * 0.23;
        // 取总分和加权的平均值防止偏差
        double combined = (totalScore + weighted) / 2.0;

        if (combined >= 92) {
            return new CefrResult("C2", "精通 (C2)",
                    "你的英语已达到精通水平！能够轻松理解几乎所有听到和读到的内容，并能流利、准确、自如地表达复杂观点。建议挑战学术写作和同声传译等高级技能。");
        } else if (combined >= 80) {
            return new CefrResult("C1", "高级 (C1)",
                    "你的英语已达到高级水平！能够理解长难文章，流利表达观点而不需要明显思考。建议多阅读原版书籍和学术论文，进一步提升专业领域的表达能力。");
        } else if (combined >= 62) {
            return new CefrResult("B2", "中高级 (B2)",
                    "你的英语处于中高级水平！能够理解复杂文章的主旨，与母语者进行较为流利的交流。建议加强学术词汇和专业领域的听说训练，向高级迈进。");
        } else if (combined >= 45) {
            return new CefrResult("B1", "中级 (B1)",
                    "你的英语处于中级水平！能够应对日常生活中的大部分场景，理解熟悉话题的要点。建议系统学习语法知识，扩大词汇量，多进行情景对话练习。");
        } else if (combined >= 28) {
            return new CefrResult("A2", "初级 (A2)",
                    "你的英语处于初级水平！能够理解简单的日常表达并进行基本的交流。建议从基础词汇、常用句型和听力训练开始，坚持每天练习。");
        } else {
            return new CefrResult("A1", "入门 (A1)",
                    "你的英语正在起步阶段！能够理解并使用简单的日常表达。建议从最基础的词汇和句型开始，每天坚持听英语儿歌、看简单的英语动画，培养语感。");
        }
    }

    /** 白名单转换 VO，绝不包含 correct_answer。兼容旧数据：若 transcript 为空但 questionText 含 [Audio transcript: "..."] 则自动提取 */
    private QuestionVO toQuestionVO(AssessmentQuestion entity) {
        QuestionVO vo = new QuestionVO();
        vo.setId(entity.getId());
        vo.setType(entity.getType());
        vo.setOptionsJson(entity.getOptionsJson());
        vo.setSortOrder(entity.getSortOrder());

        String questionText = entity.getQuestionText();
        String transcript = entity.getTranscript();

        // 兼容旧版种子数据（V2）：questionText 内嵌 [Audio transcript: "..."] 时自动提取并清洗
        if ("listening".equals(entity.getType())
                && (transcript == null || transcript.isBlank())
                && questionText != null
                && questionText.contains("[Audio transcript:")) {
            int tagStart = questionText.indexOf("[Audio transcript:");
            int quoteStart = questionText.indexOf("\"", tagStart);
            int quoteEnd = questionText.indexOf("\"", quoteStart + 1);
            if (quoteStart > 0 && quoteEnd > quoteStart) {
                transcript = questionText.substring(quoteStart + 1, quoteEnd);
            }
            int bracketEnd = questionText.indexOf("]", quoteEnd > 0 ? quoteEnd : tagStart);
            if (bracketEnd > tagStart) {
                String before = questionText.substring(0, tagStart).stripTrailing();
                String after = questionText.substring(bracketEnd + 1);
                questionText = (before + after).trim().replaceAll("\\n{3,}", "\n\n");
            }
        }

        vo.setQuestionText(questionText);
        vo.setTranscript(transcript);
        return vo;
    }

    /** List<Map> 转 JSON 字符串 */
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

    /** CEFR 评定结果 */
    private record CefrResult(String level, String label, String message) {}
}
