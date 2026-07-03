package com.es.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupportChatReq {
    @NotBlank(message = "消息不能为空")
    @Size(max = 500, message = "消息不能超过500个字符")
    private String message;

    private Long sessionId;
}
