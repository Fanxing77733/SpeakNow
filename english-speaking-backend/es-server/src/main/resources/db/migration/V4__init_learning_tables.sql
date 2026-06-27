-- =====================================================================
-- V4: 学习数据相关表
-- study_sessions: 学习会话记录（用于学习进度追踪和 AI 推荐）
-- =====================================================================

CREATE TABLE `study_sessions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `type` ENUM('practice','conversation') NOT NULL COMMENT '学习类型',
  `duration_seconds` INT NOT NULL DEFAULT 0 COMMENT '学习时长（秒）',
  `reference_id` BIGINT NULL COMMENT '关联记录ID（practice_records.id 或 conversation_sessions.id）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '学习时间 UTC',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_study_session_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
