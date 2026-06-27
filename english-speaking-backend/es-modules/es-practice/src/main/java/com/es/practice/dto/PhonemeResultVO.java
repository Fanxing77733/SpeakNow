package com.es.practice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 音素评测结果视图对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhonemeResultVO {

    /** 音素符号，如 "th", "ae" */
    private String phoneme;

    /** 音素得分 0-100 */
    private BigDecimal score;
}
