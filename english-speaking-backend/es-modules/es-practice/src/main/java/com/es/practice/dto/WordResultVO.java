package com.es.practice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 逐词评测结果视图对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WordResultVO {

    /** 单词原文 */
    private String word;

    /** 该词得分 0-100 */
    private BigDecimal score;

    /** 颜色标记: green(>=80) / yellow(60-79) / red(<60) */
    private String color;

    /** 该词中各音素的评测结果 */
    private List<PhonemeResultVO> phonemes;
}
