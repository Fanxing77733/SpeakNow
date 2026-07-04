-- =============================================================
-- V17: 匿名互评增强 — 评价分配与偏差追踪（V2.0）
-- =============================================================

ALTER TABLE peer_reviews
    ADD COLUMN assignment_id BIGINT NULL COMMENT '分配记录ID' AFTER id,
    ADD COLUMN deviation_pct DECIMAL(5,2) NULL COMMENT '与AI评分的偏差百分比' AFTER is_suspicious,
    MODIFY COLUMN score TINYINT UNSIGNED NOT NULL COMMENT '评分 1-100';

CREATE TABLE IF NOT EXISTS review_assignments (
    id              BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    recording_id    BIGINT   NOT NULL COMMENT '被评录音ID',
    reviewer_id     BIGINT   NOT NULL COMMENT '评价者ID',
    status          ENUM('pending','completed','expired') NOT NULL DEFAULT 'pending' COMMENT '分配状态',
    assigned_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间(UTC)',
    completed_at    DATETIME NULL     COMMENT '完成时间(UTC)',
    CONSTRAINT fk_assign_recording FOREIGN KEY (recording_id) REFERENCES practice_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_assign_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_assign_recording_user (recording_id, reviewer_id),
    INDEX idx_assign_reviewer_status (reviewer_id, status),
    INDEX idx_assign_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='互评分配记录表（V2.0）';
