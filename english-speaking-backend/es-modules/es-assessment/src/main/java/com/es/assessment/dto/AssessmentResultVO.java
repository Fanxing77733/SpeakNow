package com.es.assessment.dto;

import lombok.Data;

/**
 * 测评结果响应体
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

    /** 测评结果等级: beginner / intermediate / advanced */
    private String resultLevel;

    /** 评语 */
    private String message;
}
