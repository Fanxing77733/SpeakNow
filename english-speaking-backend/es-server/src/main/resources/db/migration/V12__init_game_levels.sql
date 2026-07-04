-- =============================================================
-- V12: 闯关学习 — 关卡配置与用户进度（V2.0）
-- =============================================================

CREATE TABLE IF NOT EXISTS game_levels (
    id                  BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    stage_id            INT           NOT NULL COMMENT '所属阶段 1=发音基础 2=日常对话 3=商务谈判 4=自由辩论',
    level_order         INT           NOT NULL COMMENT '阶段内序号 1-3',
    name                VARCHAR(100)  NOT NULL COMMENT '关卡名称',
    description         TEXT          NULL     COMMENT '关卡描述',
    pass_completion_rate DECIMAL(3,2) NOT NULL DEFAULT 0.60 COMMENT '通关最低完成率',
    pass_avg_score      DECIMAL(5,2)  NOT NULL DEFAULT 60.00 COMMENT '通关最低平均分',
    tasks_json          JSON          NOT NULL COMMENT '任务配置 [{"name":"...","type":"practice|conversation|grammar","contentId":1}]',
    reward_base_points  INT           NOT NULL DEFAULT 30 COMMENT '奖励基础积分',
    reward_badge_type   VARCHAR(50)   NULL     COMMENT '通关勋章类型标识',
    reward_badge_name   VARCHAR(100)  NULL     COMMENT '通关勋章名称',
    is_active           TINYINT(1)    NOT NULL DEFAULT 1 COMMENT '是否启用',
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    INDEX idx_level_stage (stage_id, level_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏关卡配置表（V2.0）';

CREATE TABLE IF NOT EXISTS user_level_progress (
    id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id         BIGINT        NOT NULL COMMENT '用户ID',
    level_id        BIGINT        NOT NULL COMMENT '关卡ID',
    status          ENUM('locked','unlocked','in_progress','completed') NOT NULL DEFAULT 'locked' COMMENT '进度状态',
    completed_tasks INT           NOT NULL DEFAULT 0 COMMENT '已完成任务数',
    total_tasks     INT           NOT NULL DEFAULT 0 COMMENT '总任务数',
    avg_score       DECIMAL(5,2)  NULL     COMMENT '平均得分',
    completed_at    DATETIME      NULL     COMMENT '通关时间(UTC)',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间(UTC)',
    CONSTRAINT fk_level_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_level_progress_level FOREIGN KEY (level_id) REFERENCES game_levels(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_progress_user_level (user_id, level_id),
    INDEX idx_progress_user (user_id),
    INDEX idx_progress_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户闯关进度表（V2.0）';

-- 种子数据：4阶段×3关卡=12条记录
INSERT INTO game_levels (stage_id, level_order, name, description, tasks_json, reward_base_points, reward_badge_type, reward_badge_name) VALUES
-- 阶段1: 发音基础
(1, 1, '音标入门',
 '掌握48个英语音标的基础发音，建立正确的发音习惯。',
 '[{"name":"元音音标跟读","type":"practice","contentId":1},{"name":"辅音音标跟读","type":"practice","contentId":2},{"name":"基础单词发音","type":"practice","contentId":3}]',
 20, 'stage_1_level_1', '音标入门者'),
(1, 2, '单词发音',
 '学习常用单词的正确发音，对比易混淆音素。',
 '[{"name":"易混淆单词跟读","type":"practice","contentId":4},{"name":"多音节单词练习","type":"practice","contentId":5},{"name":"单词发音测验","type":"practice","contentId":6}]',
 25, 'stage_1_level_2', '单词发音达人'),
(1, 3, '句子朗读',
 '朗读完整句子，练习连读、弱读和语调。',
 '[{"name":"简单句朗读","type":"practice","contentId":7},{"name":"疑问句语调练习","type":"practice","contentId":8},{"name":"段落朗读挑战","type":"practice","contentId":9}]',
 30, 'stage_1_level_3', '句子朗读高手'),

-- 阶段2: 日常对话
(2, 1, '问候与介绍',
 '学习日常问候、自我介绍和简单寒暄对话。',
 '[{"name":"自我介绍对话","type":"conversation","contentId":1},{"name":"日常问候跟读","type":"practice","contentId":10},{"name":"简单问候语法","type":"grammar","contentId":1}]',
 30, 'stage_2_level_1', '社交新人'),
(2, 2, '购物与点餐',
 '学习在商店、餐厅等场景下的英语对话。',
 '[{"name":"餐厅点餐对话","type":"conversation","contentId":2},{"name":"购物场景跟读","type":"practice","contentId":11},{"name":"数量表达语法","type":"grammar","contentId":2}]',
 35, 'stage_2_level_2', '生活达人'),
(2, 3, '旅行与交通',
 '学习旅行中常用的英语表达和对话场景。',
 '[{"name":"酒店入住对话","type":"conversation","contentId":3},{"name":"问路指路跟读","type":"practice","contentId":12},{"name":"时态运用语法","type":"grammar","contentId":3}]',
 40, 'stage_2_level_3', '旅行达人'),

-- 阶段3: 商务谈判
(3, 1, '商务会议',
 '学习参与英语商务会议的基本表达和礼仪。',
 '[{"name":"会议开场对话","type":"conversation","contentId":4},{"name":"商务术语跟读","type":"practice","contentId":1},{"name":"正式表达语法","type":"grammar","contentId":4}]',
 35, 'stage_3_level_1', '商务新人'),
(3, 2, '商务谈判',
 '学习商务谈判中的英语表达技巧和策略。',
 '[{"name":"价格谈判对话","type":"conversation","contentId":5},{"name":"谈判用语跟读","type":"practice","contentId":2},{"name":"条件句式语法","type":"grammar","contentId":5}]',
 40, 'stage_3_level_2', '谈判专家'),
(3, 3, '商务演讲',
 '学习英语演讲的结构、表达和展示技巧。',
 '[{"name":"产品演示对话","type":"conversation","contentId":6},{"name":"演讲开场跟读","type":"practice","contentId":3},{"name":"连接词运用语法","type":"grammar","contentId":6}]',
 45, 'stage_3_level_3', '演讲达人'),

-- 阶段4: 自由辩论
(4, 1, '观点表达',
 '学习清晰表达个人观点，掌握论证基本结构。',
 '[{"name":"观点陈述对话","type":"conversation","contentId":7},{"name":"论证表达跟读","type":"practice","contentId":4},{"name":"从句运用语法","type":"grammar","contentId":7}]',
 40, 'stage_4_level_1', '思辨新人'),
(4, 2, '辩论技巧',
 '学习反驳、让步等辩论技巧的英语表达。',
 '[{"name":"辩论实战对话","type":"conversation","contentId":8},{"name":"反驳用语跟读","type":"practice","contentId":5},{"name":"虚拟语气语法","type":"grammar","contentId":8}]',
 45, 'stage_4_level_2', '辩论能手'),
(4, 3, '即兴演讲',
 '学习即兴演讲技巧，提升英语思维和表达能力。',
 '[{"name":"即兴话题对话","type":"conversation","contentId":9},{"name":"演讲名句跟读","type":"practice","contentId":6},{"name":"修辞手法语法","type":"grammar","contentId":9}]',
 50, 'stage_4_level_3', '全能演说家');
