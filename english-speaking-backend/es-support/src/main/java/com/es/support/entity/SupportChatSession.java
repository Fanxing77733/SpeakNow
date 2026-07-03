package com.es.support.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("support_chat_sessions")
public class SupportChatSession {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String status;
    private Integer satisfaction;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
