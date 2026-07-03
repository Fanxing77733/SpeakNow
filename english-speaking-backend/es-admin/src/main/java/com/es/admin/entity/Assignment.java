package com.es.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("assignment")
public class Assignment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long classId;
    private Long teacherId;
    private String title;
    private String description;
    private String audioUrl;
    private String assignmentType;
    private Long contentId;
    private LocalDateTime deadline;
    private String publishType;
    private LocalDateTime publishAt;
    private String status;
    private Integer submitCount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
