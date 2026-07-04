package com.es.practice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 单条纠错建议 VO（V2.0）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CorrectionVO {
    private String originalText;
    private String correctedText;
    private String errorType;      // spelling/grammar/word_choice/sentence
    private String explanation;
}
