-- =============================================================
-- V14: 积分商城与勋章规则 — 积分规则/商城道具/勋章配置（V2.0）
-- =============================================================

CREATE TABLE IF NOT EXISTS point_rules (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    rule_code   VARCHAR(50)  NOT NULL UNIQUE COMMENT '规则编码',
    points      INT          NOT NULL COMMENT '积分值',
    description VARCHAR(200) NOT NULL COMMENT '积分说明',
    is_active   TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否启用',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分规则表（V2.0）';

CREATE TABLE IF NOT EXISTS shop_items (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    name        VARCHAR(100) NOT NULL COMMENT '道具名称',
    description TEXT         NULL     COMMENT '道具描述',
    icon        VARCHAR(200) NULL     COMMENT '图标标识',
    price       INT          NOT NULL COMMENT '所需积分',
    item_type   VARCHAR(50)  NOT NULL COMMENT '道具类型: avatar_frame/name_color/practice_double/conversation_boost',
    effect_json JSON         NULL     COMMENT '效果配置',
    stock       INT          NOT NULL DEFAULT -1 COMMENT '库存（-1=无限）',
    is_active   TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否上架',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分商城道具表（V2.0）';

CREATE TABLE IF NOT EXISTS user_shop_records (
    id              BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id         BIGINT   NOT NULL COMMENT '用户ID',
    item_id         BIGINT   NOT NULL COMMENT '道具ID',
    consumed_points INT      NOT NULL COMMENT '消费积分',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间(UTC)',
    CONSTRAINT fk_shop_record_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_shop_record_item FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE,
    INDEX idx_shop_record_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户商城购买记录表（V2.0）';

CREATE TABLE IF NOT EXISTS badge_rules (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    badge_type      VARCHAR(50)  NOT NULL UNIQUE COMMENT '勋章类型标识',
    badge_name      VARCHAR(100) NOT NULL COMMENT '勋章名称',
    badge_desc      VARCHAR(200) NULL     COMMENT '勋章描述',
    condition_json  JSON         NOT NULL COMMENT '触发条件 {"metric":"","operator":"","value":0}',
    is_active       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否启用',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='勋章规则配置表（V2.0）';

-- =============================================================
-- 种子数据
-- =============================================================

-- 积分规则
INSERT INTO point_rules (rule_code, points, description) VALUES
('PRACTICE_COMPLETED', 5, '完成一次跟读评测'),
('CONVERSATION_COMPLETED', 8, '完成一轮情景对话'),
('LEVEL_PASS', 20, '闯关通关基础分（按难度动态调整20-50）'),
('PK_WIN', 30, 'PK对战获胜'),
('PK_LOSE', 10, 'PK对战失败'),
('PK_DRAW', 20, 'PK对战平局'),
('STREAK_7', 15, '连续打卡第7天额外奖励'),
('PEER_REVIEW', 3, '完成一条有效互评'),
('BADGE_EARNED', 10, '获得新勋章奖励');

-- 商城道具
INSERT INTO shop_items (name, description, icon, price, item_type, effect_json) VALUES
('金色头像框', '为你的个人主页添加闪耀的金色边框', 'frame-gold', 100, 'avatar_frame', '{"color":"gold","style":"shining"}'),
('紫色昵称', '将昵称颜色改为尊贵紫色，持续30天', 'name-purple', 80, 'name_color', '{"color":"#8B5CF6","durationDays":30}'),
('练习双倍积分卡', '24小时内跟读练习积分翻倍', 'double-practice', 50, 'practice_double', '{"multiplier":2,"durationHours":24}'),
('对话加速卡', '情景对话评分系数×1.2，限5次对话', 'boost-conversation', 60, 'conversation_boost', '{"multiplier":1.2,"usageLimit":5}'),
('钻石头像框', '为你的个人主页添加稀有钻石边框', 'frame-diamond', 300, 'avatar_frame', '{"color":"cyan","style":"sparkling"}'),
('彩虹昵称', '昵称显示为彩虹渐变色，持续30天', 'name-rainbow', 200, 'name_color', '{"color":"rainbow","durationDays":30}');

-- 勋章规则
INSERT INTO badge_rules (badge_type, badge_name, badge_desc, condition_json) VALUES
('first_practice', '初出茅庐', '完成首次发音评测', '{"metric":"practice_count","operator":">=","value":1}'),
('first_conversation', '初次交谈', '完成首次情景对话', '{"metric":"conversation_count","operator":">=","value":1}'),
('practice_master', '练习达人', '累计完成10次跟读练习', '{"metric":"practice_count","operator":">=","value":10}'),
('conversation_pro', '对话高手', '累计完成5次情景对话', '{"metric":"conversation_count","operator":">=","value":5}'),
('pronunciation_pro', '发音达人', '发音评测均分≥85且累计完成10次', '{"metric":"practice_avg_score","operator":">=","value":85,"extraMetric":"practice_count","extraOperator":">=","extraValue":10}'),
('assessment_done', '英语测评官', '完成一次英语水平测评', '{"metric":"assessment_count","operator":">=","value":1}'),
('streak_7', '坚持不懈', '连续打卡7天', '{"metric":"streak_days","operator":">=","value":7}'),
('pk_10', '社交达人', '完成10次PK对战', '{"metric":"pk_count","operator":">=","value":10}'),
('level_first_clear', '通关勇士', '通关第一个主题关卡', '{"metric":"level_cleared","operator":">=","value":1}'),
('peer_review_10', '热心评友', '完成10条有效互评', '{"metric":"peer_review_count","operator":">=","value":10}');
