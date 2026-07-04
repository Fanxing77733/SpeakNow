package com.es.practice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 对话评分结果视图对象
 */
@Data
public class ScoreResultVO {

    /** 会话 ID */
    private Long sessionId;

    /** 语法得分 0-100 */
    private BigDecimal grammarScore;

    /** 内容相关性得分 0-100 */
    private BigDecimal relevanceScore;

    /** 流利度得分 0-100 */
    private BigDecimal fluencyScore;

    /** 综合总分 0-100 */
    private BigDecimal totalScore;

    /** 通过分数阈值 */
    private BigDecimal passScore;

    /** 是否通过 */
    private Boolean isPassed;

    /** AI 文字评语 */
    private String comment;

    /** 词汇丰富度得分 0-100 */
    private BigDecimal vocabularyScore;

    /** 发音评分 0-100 */
    private BigDecimal pronunciationScore;

    /** 互动自然度得分 0-100 */
    private BigDecimal interactionScore;

    /** 等级标签 */
    private String levelLabel;

    /** 优点列表 */
    private List<String> strengths;

    /** 待改进列表 */
    private List<String> weaknesses;

    /** 具体语法错误 */
    private List<GrammarErrorVO> grammarErrors;

    /** 推荐地道表达 */
    private List<String> suggestedExpressions;
}
