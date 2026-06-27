package com.es.practice.dto;

import lombok.Data;

/**
 * 跟读内容视图对象（白名单字段，不返回 tts_audio_url）
 */
@Data
public class ContentSentenceVO {

    /** 句子 ID */
    private Integer id;

    /** 跟读句子原文 */
    private String sentence;

    /** 难度等级 */
    private String difficulty;

    /** 话题分类 */
    private String category;
}
