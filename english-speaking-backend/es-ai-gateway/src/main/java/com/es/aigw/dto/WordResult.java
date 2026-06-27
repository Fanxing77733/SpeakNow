package com.es.aigw.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 逐词评测结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WordResult {

    /** 单词原文 */
    private String word;

    /** 该词得分 0-100 */
    private BigDecimal score;

    /** 该词中各音素的评测结果 */
    private List<PhonemeResult> phonemeResults;
}
