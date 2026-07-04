package com.es.aigw.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 对话评分结果（由 LLM 独立评分调用返回）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DialogueScoreResult {

    /** 语法得分 0-100 */
    private BigDecimal grammarScore;

    /** 内容相关性得分 0-100 */
    private BigDecimal relevanceScore;

    /** 流利度得分 0-100 */
    private BigDecimal fluencyScore;

    /** 综合总分 0-100 */
    private BigDecimal totalScore;

    /** AI 文字评语（友好、鼓励性） */
    private String comment;

    /** 词汇丰富度得分 0-100 */
    private BigDecimal vocabularyScore;

    /** 发音评分 0-100 */
    private BigDecimal pronunciationScore;

    /** 互动自然度得分 0-100 */
    private BigDecimal interactionScore;

    /** 等级标签（如 "对话达人"、"沟通新星"） */
    private String levelLabel;

    /** 优点列表 */
    private List<String> strengths;

    /** 待改进列表 */
    private List<String> weaknesses;

    /** 具体语法错误 */
    private List<GrammarErrorItem> grammarErrors;

    /** 推荐地道表达 */
    private List<String> suggestedExpressions;
}
