package com.es.practice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 发音评测结果视图对象
 */
@Data
public class PronounceEvalResultVO {

    /** 评测记录 ID */
    private Long recordId;

    /** ASR 识别文本 */
    private String asrText;

    /** 综合总分 0-100 */
    private BigDecimal totalScore;

    /** 准确度得分 */
    private BigDecimal accuracyScore;

    /** 流利度得分 */
    private BigDecimal fluencyScore;

    /** 完整度得分 */
    private BigDecimal completenessScore;

    /** 逐词评测详情 */
    private List<WordResultVO> wordResults;
}
