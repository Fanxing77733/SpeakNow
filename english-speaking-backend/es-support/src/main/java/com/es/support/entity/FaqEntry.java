package com.es.support.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("faq_entries")
public class FaqEntry {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String category;
    private String question;
    private String answer;
    private Integer sortOrder;
    private Integer isPublished;
    private Integer clickCount;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
