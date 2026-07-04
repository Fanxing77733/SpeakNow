package com.es.common.event;

import java.time.LocalDateTime;

/**
 * 勋章检测事件（V2.0）
 * 由业务模块发布，es-gamification 异步监听处理勋章检测与发放
 */
public class BadgeCheckEvent {

    private final TriggerType triggerType;
    private final Long userId;
    private final LocalDateTime occurredAt;

    public enum TriggerType {
        PRACTICE_COMPLETED,
        CONVERSATION_COMPLETED,
        LEVEL_COMPLETED,
        STREAK_UPDATED
    }

    private BadgeCheckEvent(TriggerType triggerType, Long userId) {
        this.triggerType = triggerType;
        this.userId = userId;
        this.occurredAt = LocalDateTime.now();
    }

    public static BadgeCheckEvent practiceCompleted(Long userId) {
        return new BadgeCheckEvent(TriggerType.PRACTICE_COMPLETED, userId);
    }

    public static BadgeCheckEvent conversationCompleted(Long userId) {
        return new BadgeCheckEvent(TriggerType.CONVERSATION_COMPLETED, userId);
    }

    public static BadgeCheckEvent levelCompleted(Long userId) {
        return new BadgeCheckEvent(TriggerType.LEVEL_COMPLETED, userId);
    }

    public static BadgeCheckEvent streakUpdated(Long userId) {
        return new BadgeCheckEvent(TriggerType.STREAK_UPDATED, userId);
    }

    // ============ Getters ============

    public TriggerType getTriggerType() { return triggerType; }
    public Long getUserId() { return userId; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
}
