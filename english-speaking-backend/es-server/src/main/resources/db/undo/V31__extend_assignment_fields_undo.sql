-- V31 回滚：移除作业表扩展字段
ALTER TABLE assignment
  DROP COLUMN scene_key,
  DROP COLUMN difficulty,
  DROP COLUMN required_rounds;
