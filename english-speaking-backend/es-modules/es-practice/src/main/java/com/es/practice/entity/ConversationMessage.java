package com.es.practice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 对话训练消息实体，映射 conversation_messages 表
 */
@Data
@TableName("`conversation_messages`")
public class ConversationMessage {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属会话 ID */
    private Long sessionId;

    /** 对话轮次（从 1 开始递增） */
    private Integer round;

    /** 说话角色: user / ai */
    private String role;

    /** 消息文本内容 */
    private String content;

    /** 音频 URL（user 角色为录音，ai 角色为 TTS） */
    private String audioUrl;

    /** 消息创建时间 UTC */
    private LocalDateTime createdAt;
}
