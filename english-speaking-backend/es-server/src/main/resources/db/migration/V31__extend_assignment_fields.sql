-- V31: 作业表扩展 — 情景对话 + 跟读作业配置字段
ALTER TABLE assignment
  ADD COLUMN scene_key VARCHAR(50) COMMENT '内置场景标识(如restaurant/airport)，与content_id二选一',
  ADD COLUMN difficulty VARCHAR(20) DEFAULT 'MEDIUM' COMMENT '难度 EASY/MEDIUM/HARD',
  ADD COLUMN required_rounds INT DEFAULT 5 COMMENT '要求对话轮数（CONVERSATION类型使用），默认5轮';
