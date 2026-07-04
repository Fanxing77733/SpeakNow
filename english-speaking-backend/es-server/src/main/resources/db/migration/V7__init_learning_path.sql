-- =============================================================
-- V7: 初始化学习路径与打卡表（V2.0）
-- =============================================================

CREATE TABLE IF NOT EXISTS learning_paths (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id         BIGINT       NOT NULL COMMENT '用户ID',
    path_type       ENUM('exam_middle','cet4_6','daily','custom') NOT NULL COMMENT '路径类型',
    status          ENUM('active','paused','completed') NOT NULL DEFAULT 'active' COMMENT '状态',
    current_phase   TINYINT      NOT NULL DEFAULT 1 COMMENT '当前阶段',
    progress_pct    DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '完成百分比',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间(UTC)',
    CONSTRAINT fk_path_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_path_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习路径表（V2.0）';

CREATE TABLE IF NOT EXISTS learning_path_tasks (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    path_id         BIGINT       NOT NULL COMMENT '学习路径ID',
    phase           TINYINT      NOT NULL COMMENT '阶段',
    task_type       ENUM('practice','conversation','grammar','vocab') NOT NULL COMMENT '任务类型',
    task_ref_id     INT          NULL     COMMENT '关联内容ID',
    scheduled_date  DATE         NOT NULL COMMENT '计划日期',
    status          ENUM('pending','completed','skipped') NOT NULL DEFAULT 'pending' COMMENT '状态',
    completed_at    DATETIME     NULL     COMMENT '完成时间',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    CONSTRAINT fk_task_path FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    INDEX idx_task_path_date (path_id, scheduled_date),
    INDEX idx_task_path_status (path_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习路径任务表（V2.0）';

CREATE TABLE IF NOT EXISTS daily_checkins (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id         BIGINT       NOT NULL COMMENT '用户ID',
    checkin_date    DATE         NOT NULL COMMENT '打卡日期',
    task_count      TINYINT      NOT NULL DEFAULT 0 COMMENT '当日完成任务数',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间(UTC)',
    CONSTRAINT fk_checkin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_checkin_user_date (user_id, checkin_date),
    INDEX idx_checkin_date (checkin_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日打卡表（V2.0）';
