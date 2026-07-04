package com.es.user.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户画像实体（V2.0）
 * 映射 user_profile 表，驱动个性化推荐与学习路径
 */
@Data
@TableName("user_profile")
public class UserProfile {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 发音得分趋势（最近10次评测的JSON数组） */
    private String pronunciationTrend;

    /** 流利度趋势数据 */
    private String fluencyTrend;

    /** 语法准确度均值 0-100 */
    private BigDecimal grammarAccuracy;

    /** 偏好场景类型 Top5（JSON数组，如 ["campus","travel"]） */
    private String preferredScenes;

    /** 偏好练习时段 */
    private String preferredTime;

    /** 平均单次练习时长（分钟） */
    private Integer avgSessionMinutes;

    /** 连续打卡天数 */
    private Integer streakDays;

    /** 本周活跃天数 */
    private Integer weeklyActiveDays;

    /** 总练习次数（仅统计 completed 状态） */
    private Integer totalPracticeCount;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
