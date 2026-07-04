package com.es.practice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 语法错题本实体（V2.0），映射 grammar_error_book 表
 */
@Data
@TableName("grammar_error_book")
public class GrammarErrorBook {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 用户原始文本 */
    private String originalText;

    /** 纠正后文本 */
    private String correctedText;

    /** 错误类型: spelling/grammar/word_choice/sentence */
    private String errorType;

    /** 语法解释 */
    private String explanation;

    /** 错误来源: practice/conversation/manual */
    private String source;

    private LocalDateTime createdAt;
}
