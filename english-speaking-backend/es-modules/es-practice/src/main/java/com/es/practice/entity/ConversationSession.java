package com.es.practice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 对话训练会话实体，映射 conversation_sessions 表
 */
@Data
@TableName("`conversation_sessions`")
public class ConversationSession {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户 ID */
    private Long userId;

    /** 对话场景（restaurant/hotel/airport/shopping/hospital/interview/casual/meeting） */
    private String scene;

    /** 难度等级: beginner / intermediate / advanced */
    private String difficulty;

    /** 会话状态: active / completed / asr_failed / llm_timeout / llm_sensitive / user_aborted */
    private String status;

    /** 总对话轮数 */
    private Integer totalRounds;

    /** 语法评分 (权重 40%) */
    private BigDecimal grammarScore;

    /** 内容相关性评分 (权重 30%) */
    private BigDecimal relevanceScore;

    /** 流利度评分 (权重 30%) */
    private BigDecimal fluencyScore;

    /** 综合评分 */
    private BigDecimal totalScore;

    /** 总录音时长（秒） */
    private Integer totalDurationSeconds;

    /** 会话创建时间 UTC */
    private LocalDateTime createdAt;
}
