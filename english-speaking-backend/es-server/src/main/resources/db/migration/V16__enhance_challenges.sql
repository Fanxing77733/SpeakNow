-- =============================================================
-- V16: 组内语音挑战增强 — 描述/周期/多轮提交（V2.0）
-- =============================================================

ALTER TABLE group_challenges
    ADD COLUMN description TEXT NULL COMMENT '挑战描述' AFTER title,
    ADD COLUMN duration_hours INT NOT NULL DEFAULT 168 COMMENT '挑战周期（小时，范围24-168）' AFTER ends_at,
    ADD COLUMN max_submissions INT NOT NULL DEFAULT 3 COMMENT '每人最多提交次数' AFTER duration_hours;

-- 移除唯一约束以支持多轮提交
ALTER TABLE challenge_submissions
    DROP INDEX idx_sub_challenge_user,
    ADD COLUMN submission_number INT NOT NULL DEFAULT 1 COMMENT '第几次提交' AFTER user_id,
    ADD INDEX idx_sub_challenge_user (challenge_id, user_id, submission_number);
