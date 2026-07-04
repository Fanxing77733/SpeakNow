-- V28: 预置管理员/教师/运维账号（密码均为简单密码，首次登录后应修改）
-- 角色: ADMIN=超级管理员, TEACHER=教师, OPERATOR=运维人员
-- 使用 INSERT IGNORE 避免重复执行时出错

INSERT IGNORE INTO users (email, password_hash, role, created_at, updated_at) VALUES
('admin@english-speaking.com', '$2b$12$F/cNEeWb70wre.48UTqwx.zC7E9.SDxNZRPaOIJPBgEIDv9UPlU.a', 'ADMIN', NOW(), NOW()),
('teacher@english-speaking.com', '$2b$12$hjo0KydXYVxGLxFGnWciQO8o.JAClDH8sges/Sm3LBqt8FeNQ8JyO', 'TEACHER', NOW(), NOW()),
('operator@english-speaking.com', '$2b$12$y2oQbj5ufut6b3D2ma4aq.y6lNqNrUERp8XA1dF/npYy1AfC7ULrO', 'OPERATOR', NOW(), NOW());
