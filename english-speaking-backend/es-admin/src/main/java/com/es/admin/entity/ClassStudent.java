package com.es.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("class_student")
public class ClassStudent {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long classId;
    private Long studentId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime joinedAt;
}
