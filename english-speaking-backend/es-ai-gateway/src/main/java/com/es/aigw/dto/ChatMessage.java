package com.es.aigw.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 对话消息（LLM 上下文传输用）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    /** 角色：user / assistant */
    private String role;

    /** 消息文本内容 */
    private String content;
}
