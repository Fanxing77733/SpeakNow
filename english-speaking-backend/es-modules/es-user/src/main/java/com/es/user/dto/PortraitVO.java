package com.es.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 用户画像响应 VO（V2.0）
 * 四维画像：基础/能力/偏好/行为
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortraitVO {

    // ===== 基础维度 =====
    private Integer age;
    private String goal;
    private String level;
    private String cefrLevel;

    // ===== 能力维度 =====
    /** 发音评测趋势：上升/持平/下降 */
    private String pronunciationTrend;
    /** 语法准确度均值 */
    private BigDecimal grammarAccuracy;
    /** 最近发音评测均分 */
    private BigDecimal avgPronunciationScore;

    // ===== 偏好维度 =====
    /** 偏好练习时段 */
    private String preferredTime;
    /** 偏好场景列表 */
    private List<String> preferredScenes;

    // ===== 行为维度 =====
    /** 连续打卡天数 */
    private Integer streakDays;
    /** 本周活跃天数 */
    private Integer weeklyActiveDays;
    /** 总练习次数 */
    private Integer totalPracticeCount;
    /** 平均每次练习时长（分钟） */
    private Integer avgSessionMinutes;
}
