package com.es.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("operation_logs")
public class OperationLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long operatorId;
    private String action;
    private String targetType;
    private Long targetId;
    private String detail;
    private String ip;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
