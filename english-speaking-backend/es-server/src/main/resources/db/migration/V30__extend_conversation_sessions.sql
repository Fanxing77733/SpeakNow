-- =====================================================================
-- V30: 扩展 conversation_sessions 表，支持角色扮演模式
-- 新增 roleplay_scene_id、pass_score、is_passed 字段
-- =====================================================================

ALTER TABLE conversation_sessions
    ADD COLUMN roleplay_scene_id BIGINT NULL COMMENT '关联的角色扮演场景ID（NULL=旧版自由对话）' AFTER scene,
    ADD COLUMN pass_score DECIMAL(5,2) NULL COMMENT '本场通过分数阈值（从场景配置快照）' AFTER total_score,
    ADD COLUMN is_passed TINYINT(1) NULL COMMENT '是否通过（total_score >= pass_score）' AFTER pass_score,
    ADD INDEX idx_roleplay_scene (roleplay_scene_id);
