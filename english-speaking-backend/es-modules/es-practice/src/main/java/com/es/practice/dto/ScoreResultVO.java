package com.es.practice.dto;

import lombok.Data;

import java.math.BigDecimal;

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

    /** AI 文字评语 */
    private String comment;
}
