package com.es.learning.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 学习进度汇总响应 VO
 * <pre>
 * 有数据: { "empty": false, "summary": { ... } }
 * 无数据: { "empty": true, "summary": null }
 * </pre>
 */
@Data
public class ProgressSummaryVO {

    /** 是否为空（新用户无任何学习记录） */
    private boolean empty;

    /** 汇总详情，empty=true 时为 null */
    private SummaryDetail summary;

    @Data
    public static class SummaryDetail {

        /** 总练习次数（已完成） */
        private Integer totalPractices;

        /** 总学习时长（秒） */
        private Integer totalDurationSeconds;

        /** 历史最高分 */
        private BigDecimal highestScore;

        /** 格式化后的总学习时长，如 "2h 30m" */
        private String totalDurationFormatted;
    }
}
