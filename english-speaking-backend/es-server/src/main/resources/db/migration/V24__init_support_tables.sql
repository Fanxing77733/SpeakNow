-- V24: 智能客服模块 — FAQ 帮助中心 + LLM RAG 对话客服
-- 数据库: english_speaking

-- 1. FAQ 条目表
CREATE TABLE faq_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL COMMENT '分类: account/feature/payment/tech/learning',
    question VARCHAR(500) NOT NULL COMMENT '问题',
    answer TEXT NOT NULL COMMENT '答案（Markdown 格式）',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序（越大越靠前）',
    is_published TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否发布',
    click_count INT NOT NULL DEFAULT 0 COMMENT '点击次数',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_published (category, is_published),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='FAQ 条目';

-- 2. 客服会话表
CREATE TABLE support_chat_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/CLOSED/ESCALATED',
    satisfaction TINYINT COMMENT '满意度: 1=满意, 0=不满意',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客服会话';

-- 3. 客服消息表
CREATE TABLE support_chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL COMMENT '会话 ID',
    role VARCHAR(10) NOT NULL COMMENT 'USER/AI/SYSTEM',
    content TEXT NOT NULL COMMENT '消息内容',
    confidence DECIMAL(3,2) COMMENT 'LLM 置信度 (仅 AI 消息)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客服消息';

-- 4. 人工工单表
CREATE TABLE support_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT COMMENT '关联客服会话 ID',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    question TEXT NOT NULL COMMENT '用户原始问题',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/IN_PROGRESS/RESOLVED/CLOSED',
    assignee_id BIGINT COMMENT '处理人（运营人员 ID）',
    resolution TEXT COMMENT '处理结果',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME COMMENT '解决时间',
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人工工单';

-- 种子数据: 预置 FAQ
INSERT INTO faq_entries (category, question, answer, sort_order) VALUES
('account', '如何注册账号？', '点击首页右上角的"注册"按钮，填写邮箱或手机号、密码（8-20位，需包含字母和数字）、年龄和学习目标，提交后即可完成注册。注册成功后自动登录。', 100),
('account', '忘记密码怎么办？', '目前支持在"我的 → 安全中心"中修改密码（需验证原密码）。如果确实忘记了密码，请联系客服处理。', 90),
('account', '如何注销账号？', '在"我的 → 安全中心 → 账号注销"中申请注销。提交申请后有7天冷静期，冷静期内登录即自动撤销注销申请。冷静期过后系统将匿名化处理您的数据。', 80),
('feature', '如何进行发音评测？', '进入"发音评测"页面，选择一句跟读内容，长按录音按钮开始朗读，松手后系统会自动评分。评分包括准确度、流利度和完整度三个维度，还会用绿色/黄色/红色标记每个单词的发音质量。', 100),
('feature', '如何进行情景对话？', '进入"场景对话"页面，选择一个场景和难度，AI 虚拟角色会发起对话。您只需长按录音按钮进行英文回复，AI 会自动识别您的内容并给出回复。完成多轮对话后会有一个综合评分。', 90),
('feature', '对话评分是怎么计算的？', '对话结束后的评分综合考虑三个方面：语法准确性（40%）、话题相关性（30%）和流利度（30%）。评分由 AI 独立完成，与对话生成使用不同的模型参数，确保评分客观。', 80),
('feature', '什么是话题陈述？', '话题陈述是一种进阶练习方式：系统给出一个话题，您有30秒时间准备，然后用1-2分钟进行英文陈述。系统会根据您的语法、内容逻辑、流利度和发音进行综合评估。', 70),
('feature', '如何查看学习进度？', '在"学习进度"页面可以查看您的总练习次数、学习时长和最高分。还有练习趋势图、能力雷达图和打卡日历，帮助您全面了解自己的学习情况。', 60),
('payment', '目前有哪些收费项目？', '当前版本为免费使用阶段，所有功能（发音评测、情景对话、语法纠错等）均可免费体验。后续如有收费计划会提前公告通知。', 100),
('payment', '如何获得积分？', '完成发音评测、情景对话、闯关任务等都可以获得积分。积分可以在积分商城兑换虚拟道具。', 80),
('tech', '录音没有反应怎么办？', '请检查以下几点：1）浏览器是否已授权麦克风权限；2）录音时长需超过0.5秒；3）确保环境安静，发音清晰。如果问题依然存在，建议使用 Chrome 浏览器或更新浏览器版本。', 100),
('tech', '为什么我的录音评分很低？', '评分受多种因素影响：发音准确度、语速、重音位置等。建议参考逐词颜色标记（红色=需改进）和音素纠错面板，针对薄弱音素进行专项练习。同时确保录音环境安静，麦克风距离适中。', 80),
('tech', '支持哪些浏览器？', '推荐使用 Chrome、Edge、Safari、Firefox 的最新两个大版本。移动端支持 iOS Safari（14.5+）和 Android Chrome（70+）。微信内置浏览器也可以使用，但部分功能可能受限。', 70),
('learning', '如何提高口语水平？', '我们建议采用"练习→评测→纠正→应用"的学习闭环：1）每天进行发音跟读练习，关注逐词反馈；2）参加情景对话练习，在真实语境中运用；3）针对薄弱音素进行专项纠错；4）坚持每日打卡，保持学习连续性。', 100),
('learning', '如何选择适合自己的难度？', '系统会根据您的英语水平测评结果自动推荐合适难度的内容。您也可以手动调整难度：初级适合英语初学者，中级适合有一定基础的学员，高级适合希望挑战的学员。', 80);
