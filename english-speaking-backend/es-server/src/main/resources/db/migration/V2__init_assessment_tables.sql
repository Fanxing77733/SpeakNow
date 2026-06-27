-- =====================================================================
-- V2: 测评相关表
-- assessment_questions: 测评题库（含 20 条 V1.0 固定测评种子数据）
-- assessment_records: 用户测评记录
-- =====================================================================

-- 1. 测评题库表
CREATE TABLE `assessment_questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` ENUM('vocab','grammar','reading','listening') NOT NULL COMMENT '题目类型',
  `question_text` TEXT NOT NULL COMMENT '题目文本',
  `options_json` JSON NOT NULL COMMENT '选项列表 [{"key":"A","text":"..."},...]',
  `correct_answer` VARCHAR(10) NOT NULL COMMENT '正确答案（如 A/B/C/D）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `difficulty` DECIMAL(6,4) NOT NULL DEFAULT 1.0000 COMMENT 'IRT 难度参数',
  `cefr_level` VARCHAR(4) NULL COMMENT 'CEFR 等级 A1-C2',
  PRIMARY KEY (`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_cefr_level` (`cefr_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 测评记录表
CREATE TABLE `assessment_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `assessment_type` ENUM('fixed','adaptive') NOT NULL COMMENT '测评类型',
  `total_score` TINYINT NULL COMMENT '总分',
  `vocab_score` TINYINT NULL COMMENT '词汇得分',
  `grammar_score` TINYINT NULL COMMENT '语法得分',
  `reading_score` TINYINT NULL COMMENT '阅读得分',
  `listening_score` TINYINT NULL COMMENT '听力得分',
  `result_level` ENUM('beginner','intermediate','advanced') NULL COMMENT '测评结果等级',
  `cefr_level` VARCHAR(4) NULL COMMENT 'CEFR 等级',
  `answers_json` JSON NOT NULL COMMENT '作答明细 [{"questionId":1,"userAnswer":"A","isCorrect":true},...]',
  `ability_theta` DECIMAL(6,4) NULL COMMENT 'IRT 能力估计值',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '测评时间 UTC',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_assessment_record_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- V1.0 固定测评种子数据（20 题：词汇5 + 语法5 + 阅读5 + 听力5）
-- =====================================================================

-- ========== 词汇题（5 题） ==========
INSERT INTO `assessment_questions` (`type`, `question_text`, `options_json`, `correct_answer`, `sort_order`, `difficulty`, `cefr_level`) VALUES
('vocab',
 'What does "ubiquitous" mean?',
 '[{"key":"A","text":"found everywhere"},{"key":"B","text":"very small"},{"key":"C","text":"extremely fast"},{"key":"D","text":"quite expensive"}]',
 'A', 1, 1.5000, 'B2'),

('vocab',
 'Choose the synonym of "benevolent".',
 '[{"key":"A","text":"angry"},{"key":"B","text":"kind"},{"key":"C","text":"lazy"},{"key":"D","text":"noisy"}]',
 'B', 2, 1.2000, 'B1'),

('vocab',
 'What is the meaning of "ephemeral"?',
 '[{"key":"A","text":"eternal"},{"key":"B","text":"widespread"},{"key":"C","text":"short-lived"},{"key":"D","text":"complicated"}]',
 'C', 3, 1.6000, 'C1'),

('vocab',
 '"Meticulous" most nearly means:',
 '[{"key":"A","text":"careful"},{"key":"B","text":"tired"},{"key":"C","text":"famous"},{"key":"D","text":"ordinary"}]',
 'A', 4, 1.3000, 'B2'),

('vocab',
 'The term "resilient" refers to someone who is:',
 '[{"key":"A","text":"easily offended"},{"key":"B","text":"able to recover quickly"},{"key":"C","text":"always late"},{"key":"D","text":"extremely wealthy"}]',
 'B', 5, 1.4000, 'B2');

-- ========== 语法题（5 题） ==========
INSERT INTO `assessment_questions` (`type`, `question_text`, `options_json`, `correct_answer`, `sort_order`, `difficulty`, `cefr_level`) VALUES
('grammar',
 'She ___ to school every day.',
 '[{"key":"A","text":"go"},{"key":"B","text":"goes"},{"key":"C","text":"going"},{"key":"D","text":"gone"}]',
 'B', 6, 0.8000, 'A1'),

('grammar',
 'They ___ already ___ their homework.',
 '[{"key":"A","text":"has / finish"},{"key":"B","text":"have / finished"},{"key":"C","text":"had / finish"},{"key":"D","text":"having / finished"}]',
 'B', 7, 1.0000, 'A2'),

('grammar',
 'If I ___ rich, I would travel the world.',
 '[{"key":"A","text":"am"},{"key":"B","text":"was"},{"key":"C","text":"were"},{"key":"D","text":"be"}]',
 'C', 8, 1.3000, 'B1'),

('grammar',
 'The book ___ by J.K. Rowling.',
 '[{"key":"A","text":"was written"},{"key":"B","text":"is writing"},{"key":"C","text":"wrote"},{"key":"D","text":"has wrote"}]',
 'A', 9, 1.1000, 'A2'),

('grammar',
 'Neither the teacher nor the students ___ in the classroom.',
 '[{"key":"A","text":"is"},{"key":"B","text":"are"},{"key":"C","text":"was"},{"key":"D","text":"be"}]',
 'B', 10, 1.7000, 'B2');

-- ========== 阅读题（5 题） ==========
INSERT INTO `assessment_questions` (`type`, `question_text`, `options_json`, `correct_answer`, `sort_order`, `difficulty`, `cefr_level`) VALUES
('reading',
 'Read the passage and answer the question:\n\n"Emma loves sunny days. Every morning, she opens her window and takes a deep breath of fresh air. She often goes for a walk in the park near her house."\n\nWhat does Emma do every morning?',
 '[{"key":"A","text":"She reads a book"},{"key":"B","text":"She opens her window"},{"key":"C","text":"She cooks breakfast"},{"key":"D","text":"She calls her friend"}]',
 'B', 11, 1.0000, 'A2'),

('reading',
 'Read the passage and answer:\n\n"Tom works as a chef at a famous restaurant. His specialty is Italian cuisine, and customers come from far away to taste his handmade pasta. Despite his success, Tom still practices new recipes every weekend."\n\nWhy do customers come from far away?',
 '[{"key":"A","text":"To see the building"},{"key":"B","text":"To taste Tom\'s pasta"},{"key":"C","text":"To meet the owner"},{"key":"D","text":"To listen to music"}]',
 'B', 12, 1.2000, 'B1'),

('reading',
 'Read the passage and answer:\n\n"Climate change is one of the most pressing issues of our time. Rising global temperatures have led to melting ice caps, more frequent extreme weather events, and disruption of ecosystems worldwide."\n\nAccording to the passage, what has caused melting ice caps?',
 '[{"key":"A","text":"Ocean pollution"},{"key":"B","text":"Rising global temperatures"},{"key":"C","text":"Deforestation"},{"key":"D","text":"Population growth"}]',
 'B', 13, 1.8000, 'B2'),

('reading',
 'Read the passage and answer:\n\n"Sarah decided to learn Spanish because she wanted to travel to South America. She downloaded a language app and practiced for thirty minutes every day. After six months, she could hold basic conversations with native speakers."\n\nHow long did Sarah practice every day?',
 '[{"key":"A","text":"Fifteen minutes"},{"key":"B","text":"Thirty minutes"},{"key":"C","text":"One hour"},{"key":"D","text":"Two hours"}]',
 'B', 14, 1.1000, 'A2'),

('reading',
 'Read the passage and answer:\n\n"The Industrial Revolution began in Britain in the late 18th century. It transformed agriculture, manufacturing, and transportation. Many people moved from rural areas to cities in search of factory work, fundamentally changing the social structure of society."\n\nWhat was one major effect of the Industrial Revolution?',
 '[{"key":"A","text":"People moved from cities to farms"},{"key":"B","text":"Agriculture became more important than manufacturing"},{"key":"C","text":"People moved to cities for factory jobs"},{"key":"D","text":"Transportation became less important"}]',
 'C', 15, 2.0000, 'C1');

-- ========== 听力题（5 题，文本形式供题库存储，实际播放使用 TTS 音频） ==========
INSERT INTO `assessment_questions` (`type`, `question_text`, `options_json`, `correct_answer`, `sort_order`, `difficulty`, `cefr_level`) VALUES
('listening',
 'Listen to the audio and answer:\n\n[Audio transcript: "Hello, I\'d like to order a large pizza with extra cheese, please."]\n\nWhat did the speaker want to order?',
 '[{"key":"A","text":"A hamburger"},{"key":"B","text":"A large pizza"},{"key":"C","text":"A salad"},{"key":"D","text":"A sandwich"}]',
 'B', 16, 0.9000, 'A1'),

('listening',
 'Listen to the audio and answer:\n\n[Audio transcript: "The train to London will depart from Platform 7 at 3:15 PM. Passengers are advised to arrive at least ten minutes early."]\n\nWhat time does the train depart?',
 '[{"key":"A","text":"2:15 PM"},{"key":"B","text":"3:15 PM"},{"key":"C","text":"3:45 PM"},{"key":"D","text":"4:15 PM"}]',
 'B', 17, 1.0000, 'A2'),

('listening',
 'Listen to the audio and answer:\n\n[Audio transcript: "I\'ve been working on this project for three months now, and I\'m finally seeing some progress. The team has been incredibly supportive throughout the process."]\n\nHow does the speaker feel about the project?',
 '[{"key":"A","text":"Frustrated and ready to quit"},{"key":"B","text":"Positive and encouraged by progress"},{"key":"C","text":"Confused about the goals"},{"key":"D","text":"Angry at the team"}]',
 'B', 18, 1.5000, 'B1'),

('listening',
 'Listen to the audio and answer:\n\n[Audio transcript: "If you\'re looking for the museum, go straight down this street for two blocks, then turn right at the traffic light. You\'ll see a large red brick building on your left. That\'s the museum."]\n\nWhat should you do after walking two blocks?',
 '[{"key":"A","text":"Turn left at the traffic light"},{"key":"B","text":"Turn right at the traffic light"},{"key":"C","text":"Cross the street"},{"key":"D","text":"Stop at the corner"}]',
 'B', 19, 1.3000, 'B1'),

('listening',
 'Listen to the audio and answer:\n\n[Audio transcript: "The conference has been postponed due to unforeseen circumstances. We apologize for any inconvenience this may cause and will notify all registered attendees of the new date as soon as it is confirmed."]\n\nWhy was the conference postponed?',
 '[{"key":"A","text":"The venue was too small"},{"key":"B","text":"Too few people registered"},{"key":"C","text":"Unforeseen circumstances"},{"key":"D","text":"The speaker canceled"}]',
 'C', 20, 1.6000, 'B2');
