-- =============================================================
-- V5: 初始化用户画像表（V2.0）
-- 用户画像数据驱动个性化推荐与学习路径
-- =============================================================

CREATE TABLE IF NOT EXISTS user_profile (
    id                      BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id                 BIGINT       NOT NULL COMMENT '关联用户ID',
    pronunciation_trend     JSON         NULL     COMMENT '发音得分趋势数据（最近10次）',
    fluency_trend           JSON         NULL     COMMENT '流利度趋势数据',
    grammar_accuracy        DECIMAL(5,2) NULL     COMMENT '语法准确度均值',
    preferred_scenes        JSON         NULL     COMMENT '偏好场景类型Top5',
    preferred_time          VARCHAR(20)  NULL     COMMENT '偏好练习时段（morning/afternoon/evening/night）',
    avg_session_minutes     SMALLINT     NULL     COMMENT '平均单次练习时长（分钟）',
    streak_days             INT          NOT NULL DEFAULT 0 COMMENT '连续打卡天数',
    weekly_active_days      TINYINT      NULL     COMMENT '本周活跃天数',
    total_practice_count    INT          NOT NULL DEFAULT 0 COMMENT '总练习次数（completed）',
    updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间(UTC)',
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_profile_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户画像表（V2.0）';

-- 为新注册用户自动创建画像记录
INSERT INTO user_profile (user_id, updated_at)
SELECT id, NOW() FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_profile up WHERE up.user_id = u.id);
