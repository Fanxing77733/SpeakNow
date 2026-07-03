package com.es.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("content_review_queue")
public class ContentReviewQueue {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String contentType;
    private Long contentId;
    private Long userId;
    private String contentText;
    private Double aiScore;
    private String aiTags;
    private String status;
    private Long reviewerId;
    private String reviewComment;
    private LocalDateTime reviewedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
