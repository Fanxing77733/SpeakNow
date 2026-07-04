package com.es.practice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 语法错误条目 VO（对话评分中返回的具体语法错误）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrammarErrorVO {

    /** 错误原文 */
    private String error;

    /** 正确表达 */
    private String correction;

    /** 中文解释 */
    private String explanation;
}
