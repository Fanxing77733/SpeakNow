-- 回滚 V2: 删除测评相关表（先删子表再删主表）
DROP TABLE IF EXISTS `assessment_records`;
DROP TABLE IF EXISTS `assessment_questions`;
