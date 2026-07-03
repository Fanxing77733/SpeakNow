package com.es.practice.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("speech_sessions")
public class SpeechSession {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Integer topicId;
    private String status;
    private String audioUrl;
    private String asrText;
    private BigDecimal grammarScore;
    private BigDecimal contentScore;
    private BigDecimal fluencyScore;
    private BigDecimal pronunciationScore;
    private BigDecimal totalScore;
    private String comment;
    private Integer durationSeconds;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
