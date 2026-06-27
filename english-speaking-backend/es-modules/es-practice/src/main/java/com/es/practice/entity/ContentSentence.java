package com.es.practice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 跟读内容实体，映射 content_sentences 表
 */
@Data
@TableName("`content_sentences`")
public class ContentSentence {

    @TableId(type = IdType.AUTO)
    private Integer id;

    /** 跟读句子原文 */
    private String sentence;

    /** 难度等级: beginner / intermediate / advanced */
    private String difficulty;

    /** 话题分类: greeting / daily / school / travel / work / health / technology */
    private String category;

    /** 标准发音音频 URL（TTS 生成） */
    private String ttsAudioUrl;
}
