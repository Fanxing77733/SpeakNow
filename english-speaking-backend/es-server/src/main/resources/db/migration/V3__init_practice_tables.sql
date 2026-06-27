-- =====================================================================
-- V3: 口语训练相关表
-- content_sentences: 跟读内容（含种子数据）
-- practice_records: 跟读训练记录
-- conversation_sessions: 对话训练会话
-- conversation_messages: 对话训练消息记录
-- =====================================================================

-- 1. 跟读内容表
CREATE TABLE `content_sentences` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sentence` TEXT NOT NULL COMMENT '跟读句子原文',
  `difficulty` ENUM('beginner','intermediate','advanced') NOT NULL COMMENT '难度等级',
  `category` VARCHAR(50) NULL COMMENT '话题分类（greeting/daily/school/travel/work/health/technology）',
  `tts_audio_url` VARCHAR(500) NULL COMMENT '标准发音音频 URL（TTS 生成）',
  PRIMARY KEY (`id`),
  INDEX `idx_difficulty` (`difficulty`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 跟读训练记录表
CREATE TABLE `practice_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `content_id` INT NOT NULL COMMENT '跟读内容ID',
  `audio_url` VARCHAR(500) NULL COMMENT '用户录音 OSS URL',
  `audio_deleted_at` DATETIME NULL COMMENT '录音文件过期/删除时间',
  `total_score` DECIMAL(5,2) NULL COMMENT '总评分 0-100',
  `accuracy_score` DECIMAL(5,2) NULL COMMENT '准确度得分',
  `fluency_score` DECIMAL(5,2) NULL COMMENT '流利度得分',
  `completeness_score` DECIMAL(5,2) NULL COMMENT '完整度得分',
  `stress_score` DECIMAL(5,2) NULL COMMENT '重音得分',
  `intonation_score` DECIMAL(5,2) NULL COMMENT '语调得分',
  `eval_detail_json` JSON NULL COMMENT '评测详情（逐词得分、音素得分等）',
  `status` ENUM('completed','asr_failed','eval_failed','timeout') NOT NULL DEFAULT 'completed' COMMENT '训练状态',
  `duration_seconds` INT NULL COMMENT '录音时长（秒）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '训练时间 UTC',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_content_id` (`content_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_practice_record_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 对话训练会话表
CREATE TABLE `conversation_sessions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `scene` VARCHAR(50) NOT NULL COMMENT '对话场景（restaurant/hotel/airport/shopping/hospital/interview/casual/meeting）',
  `difficulty` ENUM('beginner','intermediate','advanced') NOT NULL COMMENT '难度等级',
  `status` ENUM('active','completed','asr_failed','llm_timeout','llm_sensitive','user_aborted') NOT NULL DEFAULT 'active' COMMENT '会话状态',
  `total_rounds` TINYINT NOT NULL DEFAULT 0 COMMENT '总对话轮数',
  `grammar_score` DECIMAL(5,2) NULL COMMENT '语法评分',
  `relevance_score` DECIMAL(5,2) NULL COMMENT '内容相关性评分',
  `fluency_score` DECIMAL(5,2) NULL COMMENT '流利度评分',
  `total_score` DECIMAL(5,2) NULL COMMENT '综合评分',
  `total_duration_seconds` INT NOT NULL DEFAULT 0 COMMENT '总时长（秒）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '会话开始时间 UTC',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_conversation_session_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 对话训练消息记录表
CREATE TABLE `conversation_messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT NOT NULL COMMENT '会话ID',
  `round` TINYINT NOT NULL COMMENT '对话轮次（从 1 开始递增）',
  `role` ENUM('user','ai') NOT NULL COMMENT '说话角色',
  `content` TEXT NOT NULL COMMENT '对话文本内容',
  `audio_url` VARCHAR(500) NULL COMMENT '音频 URL（user 角色为录音，ai 角色为 TTS）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '消息时间 UTC',
  PRIMARY KEY (`id`),
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_conversation_message_session` FOREIGN KEY (`session_id`) REFERENCES `conversation_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 跟读内容种子数据（12 条，覆盖 beginner/intermediate/advanced）
-- =====================================================================

-- ========== beginner（4 条） ==========
INSERT INTO `content_sentences` (`sentence`, `difficulty`, `category`) VALUES
('Hello, how are you today?', 'beginner', 'greeting'),
('I like to read books in the evening.', 'beginner', 'daily'),
('My name is Tom and I am a student.', 'beginner', 'greeting'),
('The weather is very nice today.', 'beginner', 'daily');

-- ========== intermediate（4 条） ==========
INSERT INTO `content_sentences` (`sentence`, `difficulty`, `category`) VALUES
('I have been studying English for three years now.', 'intermediate', 'school'),
('Could you tell me how to get to the nearest subway station?', 'intermediate', 'travel'),
('She enjoys cooking traditional dishes from different countries.', 'intermediate', 'daily'),
('The conference starts at nine o\'clock tomorrow morning.', 'intermediate', 'school');

-- ========== advanced（4 条） ==========
INSERT INTO `content_sentences` (`sentence`, `difficulty`, `category`) VALUES
('Technological advancements have fundamentally reshaped the way we communicate and collaborate globally.', 'advanced', 'technology'),
('The unprecedented scale of urbanization presents both challenges and opportunities for sustainable development.', 'advanced', 'travel'),
('Despite numerous obstacles, she persevered and eventually achieved her long-term career aspirations.', 'advanced', 'daily'),
('It is widely acknowledged that artificial intelligence will play an increasingly pivotal role in education.', 'advanced', 'technology');
