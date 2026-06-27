package com.es.learning.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 学习会话记录实体，映射 study_sessions 表
 */
@Data
@TableName("`study_sessions`")
public class StudySession {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户 ID */
    private Long userId;

    /** 学习类型: practice / conversation */
    private String type;

    /** 学习时长（秒） */
    private Integer durationSeconds;

    /** 关联记录 ID（practice_records.id 或 conversation_sessions.id） */
    private Long referenceId;

    /** 学习时间 UTC */
    private LocalDateTime createdAt;
}
