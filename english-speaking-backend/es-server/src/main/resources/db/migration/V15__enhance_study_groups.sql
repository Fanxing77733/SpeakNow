-- =============================================================
-- V15: 学习小组增强 — 入组申请/每日话题（V2.0）
-- =============================================================

ALTER TABLE study_groups
    ADD COLUMN topic_push_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否开启每日话题推送' AFTER visibility,
    ADD COLUMN last_topic_at DATETIME NULL COMMENT '上次推送话题时间(UTC)' AFTER topic_push_enabled;

CREATE TABLE IF NOT EXISTS group_join_requests (
    id           BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    group_id     BIGINT   NOT NULL COMMENT '小组ID',
    user_id      BIGINT   NOT NULL COMMENT '申请用户ID',
    status       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间(UTC)',
    reviewed_at  DATETIME NULL     COMMENT '审核时间(UTC)',
    reviewer_id  BIGINT   NULL     COMMENT '审核人ID',
    CONSTRAINT fk_join_req_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_join_req_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_join_req_group_user (group_id, user_id, status),
    INDEX idx_join_req_status (group_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小组加入申请表（V2.0）';

CREATE TABLE IF NOT EXISTS group_topics (
    id           BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    group_id     BIGINT   NOT NULL COMMENT '小组ID',
    topic_content TEXT     NOT NULL COMMENT '话题内容',
    pushed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '推送时间(UTC)',
    CONSTRAINT fk_topic_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
    INDEX idx_topic_group_time (group_id, pushed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小组每日话题表（V2.0）';
