-- V23: 用户状态枚举增加 'banned' 值，支持运营端封禁功能
ALTER TABLE users MODIFY COLUMN status ENUM('active','locked','banned','deleted') NOT NULL DEFAULT 'active';
