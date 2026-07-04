-- V10: 为学习路径任务表添加 task_name 列（V2.0 任务展示需要）
ALTER TABLE learning_path_tasks ADD COLUMN task_name VARCHAR(100) NULL COMMENT '任务名称' AFTER task_type;
