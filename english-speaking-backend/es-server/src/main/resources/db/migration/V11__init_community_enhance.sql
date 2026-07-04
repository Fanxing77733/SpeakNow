-- =============================================================
-- V11: 学习社区增强 — 挑战提交 / 小组讨论 / 匿名互评（V2.0）
-- =============================================================

CREATE TABLE IF NOT EXISTS challenge_submissions (
    id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    challenge_id   BIGINT       NOT NULL COMMENT '挑战ID',
    user_id        BIGINT       NOT NULL COMMENT '提交者ID',
    practice_id    BIGINT       NULL     COMMENT '关联评测记录ID',
    score          DECIMAL(5,2) NULL     COMMENT '发音评测得分',
    submitted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间(UTC)',
    CONSTRAINT fk_sub_challenge FOREIGN KEY (challenge_id) REFERENCES group_challenges(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_sub_challenge_user (challenge_id, user_id),
    INDEX idx_sub_challenge_score (challenge_id, score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='挑战提交记录表（V2.0）';

CREATE TABLE IF NOT EXISTS group_discussions (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    group_id    BIGINT       NOT NULL COMMENT '小组ID',
    user_id     BIGINT       NOT NULL COMMENT '发帖者ID',
    content     TEXT         NOT NULL COMMENT '讨论内容',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间(UTC)',
    CONSTRAINT fk_disc_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_disc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_disc_group_time (group_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小组讨论表（V2.0）';

CREATE TABLE IF NOT EXISTS peer_reviews (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    recording_id    BIGINT       NOT NULL COMMENT '被评录音ID（practice_records.id）',
    reviewer_id     BIGINT       NOT NULL COMMENT '评价者ID',
    score           TINYINT      NOT NULL COMMENT '评分 1-100',
    comment         TEXT         NULL     COMMENT '文字评价',
    is_suspicious   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否可疑（偏差>40%）',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间(UTC)',
    CONSTRAINT fk_review_recording FOREIGN KEY (recording_id) REFERENCES practice_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_user FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_review_recording_user (recording_id, reviewer_id),
    INDEX idx_review_recording (recording_id),
    INDEX idx_review_reviewer (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='匿名互评表（V2.0）';
