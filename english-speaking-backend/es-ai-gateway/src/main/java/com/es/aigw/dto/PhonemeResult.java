package com.es.aigw.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 音素评测结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhonemeResult {

    /** 音素符号，如 "IH0", "T", "S" */
    private String phoneme;

    /** 音素得分 0-100 */
    private BigDecimal score;
}
