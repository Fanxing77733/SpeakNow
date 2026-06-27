-- =====================================================================
-- V1: 用户相关表
-- 创建 users 表，用户中心核心数据
-- =====================================================================

CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NULL UNIQUE,
  `phone` VARCHAR(20) NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(50) NULL,
  `avatar_url` VARCHAR(500) NULL COMMENT '头像OSS URL V2.0',
  `age` TINYINT NOT NULL CHECK (age >= 6 AND age <= 99),
  `goal` ENUM('daily','exam','business') NOT NULL COMMENT '学习目标',
  `level` ENUM('beginner','intermediate','advanced') NULL COMMENT '水平等级',
  `cefr_level` VARCHAR(4) NULL COMMENT 'CEFR等级 V2.0',
  `status` ENUM('active','locked','deleted') NOT NULL DEFAULT 'active' COMMENT '账号状态',
  `last_login_at` DATETIME NULL COMMENT '最近登录时间 UTC',
  `last_login_ip` VARCHAR(45) NULL COMMENT '最近登录IP',
  `feature_flags` JSON NULL COMMENT '灰度特征标志',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_email` (`email`),
  UNIQUE INDEX `idx_phone` (`phone`),
  INDEX `idx_level` (`level`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
