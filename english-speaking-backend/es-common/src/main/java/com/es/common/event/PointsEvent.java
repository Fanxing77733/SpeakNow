package com.es.common.event;

import java.time.LocalDateTime;

/**
 * 积分获取事件（V2.0）
 * 由业务模块发布，es-gamification 异步监听处理积分结算
 */
public class PointsEvent {

    private final EventType type;
    private final Long userId;
    private final LocalDateTime occurredAt;

    /** 关联业务ID（练习记录ID/会话ID/关卡ID/PK匹配ID） */
    private Long referenceId;
    /** 相关得分（用于动态计算闯关积分） */
    private Double score;
    /** 完成率（闯关通关时使用） */
    private Double completionRate;

    public enum EventType {
        PRACTICE_COMPLETED,
        CONVERSATION_COMPLETED,
        LEVEL_PASS,
        PK_WIN,
        PK_LOSE,
        PK_DRAW,
        STREAK_7,
        PEER_REVIEW
    }

    private PointsEvent(EventType type, Long userId) {
        this.type = type;
        this.userId = userId;
        this.occurredAt = LocalDateTime.now();
    }

    public static PointsEvent practiceCompleted(Long userId) {
        return new PointsEvent(EventType.PRACTICE_COMPLETED, userId);
    }

    public static PointsEvent conversationCompleted(Long userId) {
        return new PointsEvent(EventType.CONVERSATION_COMPLETED, userId);
    }

    public static PointsEvent levelPass(Long userId) {
        return new PointsEvent(EventType.LEVEL_PASS, userId);
    }

    public static PointsEvent pkWin(Long userId) {
        return new PointsEvent(EventType.PK_WIN, userId);
    }

    public static PointsEvent pkLose(Long userId) {
        return new PointsEvent(EventType.PK_LOSE, userId);
    }

    public static PointsEvent pkDraw(Long userId) {
        return new PointsEvent(EventType.PK_DRAW, userId);
    }

    public static PointsEvent streak7(Long userId) {
        return new PointsEvent(EventType.STREAK_7, userId);
    }

    public static PointsEvent peerReview(Long userId) {
        return new PointsEvent(EventType.PEER_REVIEW, userId);
    }

    // ============ Fluent setters ============

    public PointsEvent withReferenceId(Long referenceId) {
        this.referenceId = referenceId;
        return this;
    }

    public PointsEvent withScore(Double score) {
        this.score = score;
        return this;
    }

    public PointsEvent withCompletionRate(Double completionRate) {
        this.completionRate = completionRate;
        return this;
    }

    // ============ Getters ============

    public EventType getType() { return type; }
    public Long getUserId() { return userId; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public Long getReferenceId() { return referenceId; }
    public Double getScore() { return score; }
    public Double getCompletionRate() { return completionRate; }
}
