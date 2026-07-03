package com.es.support.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("support_chat_messages")
public class SupportChatMessage {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long sessionId;
    private String role;
    private String content;
    private BigDecimal confidence;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
