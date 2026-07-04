-- =============================================================
-- V8: 初始化推荐缓存表（V2.0）
-- =============================================================
CREATE TABLE IF NOT EXISTS recommendation_cache (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id         BIGINT       NOT NULL COMMENT '用户ID',
    content_type    VARCHAR(20)  NOT NULL COMMENT '内容类型: sentence/scene',
    content_id      INT          NOT NULL COMMENT '内容ID',
    score           DECIMAL(6,4) NOT NULL COMMENT '推荐评分',
    reason          VARCHAR(100) NULL     COMMENT '推荐理由',
    generated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间(UTC)',
    INDEX idx_rec_user (user_id),
    INDEX idx_rec_generated (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推荐缓存表（V2.0）';

CREATE TABLE IF NOT EXISTS prediction_results (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id         BIGINT       NOT NULL COMMENT '用户ID',
    predicted_score DECIMAL(5,2) NOT NULL COMMENT '预测得分',
    prediction_date DATE         NOT NULL COMMENT '预测日期',
    alert_type      VARCHAR(50)  NULL     COMMENT '预警类型: decline/inactive/none',
    alert_message   VARCHAR(500) NULL     COMMENT '预警消息',
    generated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间(UTC)',
    UNIQUE INDEX idx_pred_user_date (user_id, prediction_date),
    INDEX idx_pred_date (prediction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习效果预测表（V2.0）';
