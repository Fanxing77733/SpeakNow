package com.es.practice.dto;

import lombok.Data;

import java.util.List;

/**
 * 语法纠错结果 VO（V2.0）
 */
@Data
public class GrammarCheckResultVO {
    private List<CorrectionVO> corrections;
    /** 纠错结果 ID，用于后续收藏 */
    private String resultId;
}
