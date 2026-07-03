package com.es.practice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SpeechEvalResultVO {
    private Long sessionId;
    private String asrText;
    private BigDecimal grammarScore;
    private BigDecimal contentScore;
    private BigDecimal fluencyScore;
    private BigDecimal pronunciationScore;
    private BigDecimal totalScore;
    private String comment;
}
