-- 回滚 V3: 删除口语训练相关表（先删子表再删主表）
DROP TABLE IF EXISTS `conversation_messages`;
DROP TABLE IF EXISTS `conversation_sessions`;
DROP TABLE IF EXISTS `practice_records`;
DROP TABLE IF EXISTS `content_sentences`;
