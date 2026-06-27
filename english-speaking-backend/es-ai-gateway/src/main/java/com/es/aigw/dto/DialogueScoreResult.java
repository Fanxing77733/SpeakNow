package com.es.aigw.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
}
