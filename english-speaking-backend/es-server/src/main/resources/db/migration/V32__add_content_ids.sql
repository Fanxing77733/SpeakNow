-- V32: 作业表 — 支持多句跟读 content_ids
ALTER TABLE assignment
  ADD COLUMN content_ids VARCHAR(500) COMMENT '多个跟读句子ID，逗号分隔（PRONOUNCE类型使用）';
