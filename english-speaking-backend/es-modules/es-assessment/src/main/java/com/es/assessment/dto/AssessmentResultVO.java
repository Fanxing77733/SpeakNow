package com.es.assessment.dto;

import lombok.Data;

/**
 * 测评结果响应体（V3.0：CEFR 六级 + 四维得分）
 */
@Data
public class AssessmentResultVO {

    /** 测评记录 ID */
    private Long recordId;

    /** 总分 0-100 */
    private Integer totalScore;

    /** 词汇得分 0-100 */
    private Integer vocabScore;

    /** 语法得分 0-100 */
    private Integer grammarScore;

    /** 阅读得分 0-100 */
    private Integer readingScore;

    /** 听力得分 0-100 */
    private Integer listeningScore;

    /** CEFR 等级: A1 / A2 / B1 / B2 / C1 / C2 */
    private String cefrLevel;

    /** 等级中文标签 */
    private String levelLabel;

    /** 评语/学习建议 */
    private String message;

    /** 正确题数 */
    private Integer correctCount;

    /** 总题数 */
    private Integer totalQuestions;
}
