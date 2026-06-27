package com.es.aigw.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 发音评测完整结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PronunciationEvalResult {

    /** 准确度得分 0-100 */
    private BigDecimal accuracyScore;

    /** 流利度得分 0-100 */
    private BigDecimal fluencyScore;

    /** 完整度得分 0-100 */
    private BigDecimal completenessScore;

    /** 综合总分 0-100 */
    private BigDecimal totalScore;

    /** 逐词评测详情 */
    private List<WordResult> wordResults;

    /** ASR 识别出的文本 */
    private String asrText;
}
