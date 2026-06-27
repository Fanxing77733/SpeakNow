package com.es.practice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 对话消息视图对象
 */
@Data
public class MessageVO {

    /** 对话轮次 */
    private Integer round;

    /** 说话角色: user / ai */
    private String role;

    /** 消息文本内容 */
    private String content;

    /** 消息时间 */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
}
