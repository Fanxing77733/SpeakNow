-- V25: 话题陈述新题型 — 话题库 + 陈述会话
-- 数据库: english_speaking

-- 1. 话题库
CREATE TABLE speech_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '话题标题',
    description TEXT COMMENT '话题描述',
    category VARCHAR(50) NOT NULL COMMENT '分类: daily/campus/business/social',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner' COMMENT '难度: beginner/intermediate/advanced',
    preparation_seconds INT NOT NULL DEFAULT 30 COMMENT '准备时间（秒）',
    speech_seconds_min INT NOT NULL DEFAULT 60 COMMENT '最短陈述时间（秒）',
    speech_seconds_max INT NOT NULL DEFAULT 120 COMMENT '最长陈述时间（秒）',
    hints TEXT COMMENT '准备提示（JSON 数组格式）',
    is_published TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否发布',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='话题库';

-- 2. 陈述会话表
CREATE TABLE speech_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    topic_id INT NOT NULL COMMENT '话题 ID',
    status VARCHAR(20) NOT NULL DEFAULT 'PREPARING' COMMENT 'PREPARING/SPEAKING/EVALUATING/COMPLETED',
    audio_url VARCHAR(500) COMMENT '录音路径',
    asr_text TEXT COMMENT 'ASR 转写文本',
    grammar_score DECIMAL(5,2) COMMENT '语法评分 (25%)',
    content_score DECIMAL(5,2) COMMENT '内容评分 (25%)',
    fluency_score DECIMAL(5,2) COMMENT '流利度评分 (25%)',
    pronunciation_score DECIMAL(5,2) COMMENT '发音评分 (25%)',
    total_score DECIMAL(5,2) COMMENT '综合总分',
    comment TEXT COMMENT 'AI 综合评语',
    duration_seconds INT COMMENT '录音时长（秒）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陈述会话';

-- 种子数据: 预置 10 个话题
INSERT INTO speech_topics (title, description, category, difficulty, hints) VALUES
('My Favorite Hobby', 'Talk about a hobby you enjoy. Describe what it is, how you got started, and why you love it.', 'daily', 'beginner',
 '["What is your hobby?", "When did you start?", "Why do you enjoy it?", "How often do you do it?"]'),
('A Memorable Trip', 'Describe a trip that left a deep impression on you. Where did you go? Who did you go with? What happened?', 'daily', 'beginner',
 '["Where did you go?", "When was this trip?", "Who did you go with?", "What made it memorable?"]'),
('My Daily Routine', 'Describe your typical daily routine. What time do you wake up? What do you do during the day?', 'daily', 'beginner',
 '["What time do you wake up?", "What do you do in the morning?", "What about afternoon and evening?", "What is your favorite part of the day?"]'),

('The Importance of Education', 'Share your thoughts on why education is important. How does it shape individuals and society?', 'campus', 'intermediate',
 '["Why is education important to you?", "How does education change lives?", "What would you change about education?", "Give examples from your own experience."]'),
('Online Learning vs. Traditional Classroom', 'Compare online learning with traditional classroom learning. What are the pros and cons of each?', 'campus', 'intermediate',
 '["What are the advantages of online learning?", "What are the advantages of classroom learning?", "Which do you prefer?", "Why?"]'),
('My Career Goals', 'Talk about your future career plans. What job do you want to do? What steps will you take to achieve it?', 'campus', 'intermediate',
 '["What career do you want to pursue?", "Why did you choose this career?", "What skills do you need?", "What is your plan to achieve this goal?"]'),

('The Impact of Technology on Communication', 'Discuss how technology has changed the way people communicate. What are the positive and negative effects?', 'social', 'advanced',
 '["How has technology changed communication?", "What are the positive effects?", "What are the negative effects?", "What does the future look like?"]'),
('Environmental Protection', 'Talk about the importance of environmental protection. What can individuals and governments do to help?', 'social', 'advanced',
 '["Why is environmental protection important?", "What can individuals do?", "What should governments do?", "What do you personally do to help?"]'),
('The Benefits of Learning a Second Language', 'Share your views on why learning a second language is valuable. How has learning English impacted your life?', 'social', 'intermediate',
 '["Why learn a second language?", "How has English helped you?", "What is the best way to learn a language?", "What challenges have you faced?"]'),

('A Person I Admire', 'Describe a person you admire and explain why. This could be a family member, a celebrity, or a historical figure.', 'daily', 'intermediate',
 '["Who is this person?", "How did you learn about them?", "What qualities do they have?", "How have they influenced you?"]');
