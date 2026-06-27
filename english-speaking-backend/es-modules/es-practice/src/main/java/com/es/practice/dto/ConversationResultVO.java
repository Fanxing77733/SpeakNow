package com.es.practice.dto;

import lombok.Data;

import java.util.List;

/**
 * 对话会话结果视图对象
 */
@Data
public class ConversationResultVO {

    /** 会话 ID */
    private Long sessionId;

    /** 对话场景 */
    private String scene;

    /** 会话状态 */
    private String status;

    /** 当前总轮数 */
    private Integer totalRounds;

    /** AI 第一轮消息（仅 start 时返回） */
    private MessageVO firstMessage;

    /** 历史消息列表 */
    private List<MessageVO> messages;

    /** 评分信息（仅 end 时返回） */
    private ScoreResultVO scores;
}
