package com.es.practice.dto;

import lombok.Data;

/**
 * 发送对话消息响应视图对象
 * 对齐 FE Store：userText 构造用户气泡，aiText 构造 AI 气泡
 */
@Data
public class SendMessageResultVO {

    /** 本轮对话轮次 */
    private Integer round;

    /** ASR 转写并过滤后的用户文本（FE 用于构造用户气泡） */
    private String userText;

    /** LLM 生成的 AI 回复文本（FE 用于构造 AI 气泡） */
    private String aiText;

    /** 会话 ID */
    private Long sessionId;

    /** 会话当前总轮数 */
    private Integer totalRounds;
}
