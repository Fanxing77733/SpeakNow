package com.es.common.event;

import java.time.LocalDateTime;

/**
 * 用户画像更新事件（V2.0）
 * 由业务模块（es-practice）发布，es-user 异步监听处理
 */
public class PortraitEvent {

    /** 事件类型 */
    private final EventType type;
    /** 用户ID */
    private final Long userId;
    /** 事件发生时间 */
    private final LocalDateTime occurredAt;

    /** 练习得分（type=PRACTICE_COMPLETED 时有效） */
    private Integer totalScore;
    /** 准确度得分 */
    private Integer accuracyScore;
    /** 流利度得分 */
    private Integer fluencyScore;
    /** 完整度得分 */
    private Integer completenessScore;
    /** 练习时长（秒） */
    private Integer durationSeconds;

    /** 对话场景（type=CONVERSATION_COMPLETED 时有效） */
    private String scene;
    /** 会话ID */
    private Long sessionId;
    /** 对话语法得分 */
    private Integer grammarScore;
    /** 对话流利度得分 */
    private Integer conversationFluencyScore;

    /** 打卡日期（type=DAILY_CHECKIN 时有效） */
    private LocalDateTime checkinDate;

    public enum EventType {
        PRACTICE_COMPLETED,
        CONVERSATION_COMPLETED,
        DAILY_CHECKIN
    }

    private PortraitEvent(EventType type, Long userId) {
        this.type = type;
        this.userId = userId;
        this.occurredAt = LocalDateTime.now();
    }

    /** 创建"练习完成"事件 */
    public static PortraitEvent practiceCompleted(Long userId) {
        return new PortraitEvent(EventType.PRACTICE_COMPLETED, userId);
    }

    /** 创建"对话完成"事件 */
    public static PortraitEvent conversationCompleted(Long userId) {
        return new PortraitEvent(EventType.CONVERSATION_COMPLETED, userId);
    }

    /** 创建"打卡"事件 */
    public static PortraitEvent dailyCheckin(Long userId) {
        return new PortraitEvent(EventType.DAILY_CHECKIN, userId);
    }

    // ============ Fluent setters ============

    public PortraitEvent practiceScores(int total, int accuracy, int fluency, int completeness, int duration) {
        this.totalScore = total;
        this.accuracyScore = accuracy;
        this.fluencyScore = fluency;
        this.completenessScore = completeness;
        this.durationSeconds = duration;
        return this;
    }

    public PortraitEvent conversationScores(Long sid, String sc, int grammar, int fluency, int rel) {
        this.sessionId = sid;
        this.scene = sc;
        this.grammarScore = grammar;
        this.conversationFluencyScore = fluency;
        return this;
    }

    public PortraitEvent withCheckinDate(LocalDateTime date) {
        this.checkinDate = date;
        return this;
    }

    // ============ Getters ============

    public EventType getType() { return type; }
    public Long getUserId() { return userId; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public Integer getTotalScore() { return totalScore; }
    public Integer getAccuracyScore() { return accuracyScore; }
    public Integer getFluencyScore() { return fluencyScore; }
    public Integer getCompletenessScore() { return completenessScore; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public String getScene() { return scene; }
    public Long getSessionId() { return sessionId; }
    public Integer getGrammarScore() { return grammarScore; }
    public Integer getConversationFluencyScore() { return conversationFluencyScore; }
    public LocalDateTime getCheckinDate() { return checkinDate; }
}
