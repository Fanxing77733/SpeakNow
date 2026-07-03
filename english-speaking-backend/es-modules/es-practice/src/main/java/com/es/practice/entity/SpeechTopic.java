package com.es.practice.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("speech_topics")
public class SpeechTopic {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String title;
    private String description;
    private String category;
    private String difficulty;
    private Integer preparationSeconds;
    private Integer speechSecondsMin;
    private Integer speechSecondsMax;
    private String hints;
    private Integer isPublished;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
