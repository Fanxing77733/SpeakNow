package com.es.practice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 跟读训练记录实体，映射 practice_records 表
 */
@Data
@TableName("`practice_records`")
public class PracticeRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户 ID */
    private Long userId;

    /** 跟读内容 ID */
    private Integer contentId;

    /** 用户录音文件路径/URL */
    private String audioUrl;

    /** 录音文件过期/删除时间 */
    private LocalDateTime audioDeletedAt;

    /** 总评分 0-100 */
    private BigDecimal totalScore;

    /** 准确度得分 */
    private BigDecimal accuracyScore;

    /** 流利度得分 */
    private BigDecimal fluencyScore;

    /** 完整度得分 */
    private BigDecimal completenessScore;

    /** 重音得分 (V2.0) */
    private BigDecimal stressScore;

    /** 语调得分 (V2.0) */
    private BigDecimal intonationScore;

    /** 评测详情 JSON（逐词得分、音素得分等） */
    private String evalDetailJson;

    /** 训练状态: completed / asr_failed / eval_failed / timeout */
    private String status;

    /** 录音时长（秒） */
    private Integer durationSeconds;

    /** 训练时间 UTC */
    private LocalDateTime createdAt;
}
