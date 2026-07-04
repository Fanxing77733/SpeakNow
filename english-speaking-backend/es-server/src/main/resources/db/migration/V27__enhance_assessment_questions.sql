-- =====================================================================
-- V27: 测评系统全面升级
-- 1. 添加 transcript 字段支持听力题 TTS
-- 2. 替换种子数据：50 道高质量题目（含 12 道听力题）
-- 3. 修改 result_level 为 VARCHAR 支持 CEFR 六级
-- =====================================================================

-- 1. 添加听力原文列（跳过已存在的列）
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'english_speaking' AND TABLE_NAME = 'assessment_questions' AND COLUMN_NAME = 'transcript');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `assessment_questions` ADD COLUMN `transcript` TEXT NULL COMMENT ''听力题原文（用于 TTS 语音合成）'' AFTER `question_text`',
  'SELECT ''Column transcript already exists, skipping''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 修改等级字段支持 CEFR 六级（ENUM→VARCHAR 过渡，再转回 VARCHAR(8)）
ALTER TABLE `assessment_records`
  MODIFY COLUMN `result_level` VARCHAR(20) NULL COMMENT '测评等级（过渡）';

UPDATE `assessment_records` SET `result_level` =
  CASE
    WHEN `result_level` = 'beginner' THEN 'A1'
    WHEN `result_level` = 'intermediate' THEN 'B1'
    WHEN `result_level` = 'advanced' THEN 'B2'
    ELSE COALESCE(`result_level`, 'A1')
  END;

ALTER TABLE `assessment_records`
  MODIFY COLUMN `result_level` VARCHAR(8) NULL COMMENT '测评等级 A1/A2/B1/B2/C1/C2';

-- 3. 清空旧种子数据
DELETE FROM `assessment_questions`;

-- 4. 插入新种子数据（50 题库，每次测评随机抽取 30 题）

-- ========================
-- 听力题（12 题，含 transcript，每次抽取 10 题）
-- ========================

INSERT INTO `assessment_questions` (`type`, `question_text`, `transcript`, `options_json`, `correct_answer`, `sort_order`, `difficulty`, `cefr_level`) VALUES

-- A1-Listening-1
('listening',
 'Listen to the conversation and answer:\n\nWhat does the woman want to order?',
 'I''d like a cup of coffee and a slice of chocolate cake, please.',
 '[{"key":"A","text":"Coffee and cake"},{"key":"B","text":"Tea and sandwich"},{"key":"C","text":"Juice and salad"},{"key":"D","text":"Water and cookies"}]',
 'A', 1, 0.8000, 'A1'),

-- A1-Listening-2
('listening',
 'Listen and answer:\n\nWhat is the weather like today?',
 'Good morning! Today will be sunny with a high of 25 degrees. Perfect weather for outdoor activities.',
 '[{"key":"A","text":"Rainy and cold"},{"key":"B","text":"Sunny and warm"},{"key":"C","text":"Snowy and freezing"},{"key":"D","text":"Cloudy and windy"}]',
 'B', 2, 0.9000, 'A1'),

-- A2-Listening-3
('listening',
 'Listen to the directions and answer:\n\nWhere should the person go after the traffic light?',
 'Walk straight for two blocks, and when you see the traffic light, turn left. The bookstore is right next to the bank on your right.',
 '[{"key":"A","text":"Turn right"},{"key":"B","text":"Go straight"},{"key":"C","text":"Turn left"},{"key":"D","text":"Cross the bridge"}]',
 'C', 3, 1.0000, 'A2'),

-- A2-Listening-4
('listening',
 'Listen to the announcement and answer:\n\nWhat is the gate number for the London flight?',
 'Attention passengers: Flight BA248 to London is now boarding at Gate 17. Please have your boarding pass ready.',
 '[{"key":"A","text":"Gate 17"},{"key":"B","text":"Gate 7"},{"key":"C","text":"Gate 24"},{"key":"D","text":"Gate 8"}]',
 'A', 4, 1.1000, 'A2'),

-- B1-Listening-5
('listening',
 'Listen to the conversation and answer:\n\nWhy was the meeting postponed?',
 'Hi Mark, I''m calling to let you know that the project review meeting has been moved to next Wednesday. The manager has a scheduling conflict this Thursday.',
 '[{"key":"A","text":"The room was unavailable"},{"key":"B","text":"The manager has a conflict"},{"key":"C","text":"The presentation wasn''t ready"},{"key":"D","text":"Too many people were absent"}]',
 'B', 5, 1.3000, 'B1'),

-- B1-Listening-6
('listening',
 'Listen to the news clip and answer:\n\nWhat caused the traffic delay?',
 'Traffic is backed up on Highway 101 this morning due to a multi-vehicle accident near Exit 23. Emergency crews are on the scene and drivers are advised to take alternate routes.',
 '[{"key":"A","text":"Road construction"},{"key":"B","text":"Bad weather"},{"key":"C","text":"A car accident"},{"key":"D","text":"A marathon event"}]',
 'C', 6, 1.4000, 'B1'),

-- B1-Listening-7
('listening',
 'Listen to the phone message and answer:\n\nWhat does the caller want Jason to do?',
 'Hey Jason, this is Sarah from the dental clinic. Just calling to confirm your appointment for tomorrow at 2:30 PM. Please call us back if you need to reschedule.',
 '[{"key":"A","text":"Confirm or reschedule the appointment"},{"key":"B","text":"Pay the bill immediately"},{"key":"C","text":"Cancel the appointment"},{"key":"D","text":"Come in earlier tomorrow"}]',
 'A', 7, 1.2000, 'B1'),

-- B2-Listening-8
('listening',
 'Listen to the lecture excerpt and answer:\n\nWhat is the main factor contributing to coral bleaching according to the speaker?',
 'Marine biologists have observed that rising ocean temperatures are the primary driver of coral bleaching events worldwide. When water temperatures exceed normal seasonal maximums by just one degree Celsius for extended periods, corals expel the symbiotic algae living in their tissues, causing them to turn completely white.',
 '[{"key":"A","text":"Ocean pollution"},{"key":"B","text":"Rising ocean temperatures"},{"key":"C","text":"Overfishing"},{"key":"D","text":"Plastic waste"}]',
 'B', 8, 1.7000, 'B2'),

-- B2-Listening-9
('listening',
 'Listen to the interview and answer:\n\nWhat quality does the employer value most?',
 'To be honest, we''re looking for someone who can think on their feet. Technical skills can be taught, but the ability to adapt quickly to changing situations and solve problems creatively — that''s something you either have or you don''t.',
 '[{"key":"A","text":"Technical expertise"},{"key":"B","text":"Years of experience"},{"key":"C","text":"Adaptability and problem-solving"},{"key":"D","text":"Formal education"}]',
 'C', 9, 1.8000, 'B2'),

-- B2-Listening-10
('listening',
 'Listen to the radio program and answer:\n\nWhat is the main benefit of the new policy described?',
 'The city council has approved a new public transportation initiative that will expand bus routes to underserved neighborhoods. Officials estimate this will reduce average commute times by thirty percent and provide affordable transit access to over fifty thousand residents who currently lack reliable options.',
 '[{"key":"A","text":"Expanded bus routes to new areas"},{"key":"B","text":"Lower ticket prices"},{"key":"C","text":"New subway lines"},{"key":"D","text":"More parking spaces"}]',
 'A', 10, 1.6000, 'B2'),

-- C1-Listening-11
('listening',
 'Listen to the debate excerpt and answer:\n\nWhat is the speaker''s position on the issue?',
 'While I acknowledge the economic arguments for automation, we must not overlook the profound social implications. The displacement of workers is not merely a transitional inconvenience — it represents a fundamental restructuring of our social contract that requires proactive policy intervention.',
 '[{"key":"A","text":"Automation should be stopped entirely"},{"key":"B","text":"Social impacts require policy intervention"},{"key":"C","text":"Economic benefits outweigh all concerns"},{"key":"D","text":"Workers should retrain on their own"}]',
 'B', 11, 2.2000, 'C1'),

-- C1-Listening-12
('listening',
 'Listen to the documentary narration and answer:\n\nWhat paradox does the speaker highlight?',
 'Consider the paradox of the modern age: we are more connected than ever before through digital technology, yet rates of loneliness and social isolation have reached epidemic proportions. This suggests that the quality of our connections matters far more than their quantity.',
 '[{"key":"A","text":"Technology is too expensive"},{"key":"B","text":"People prefer isolation over connection"},{"key":"C","text":"More digital connection coexists with more loneliness"},{"key":"D","text":"Social media improves relationships"}]',
 'C', 12, 2.4000, 'C1');

-- ========================
-- 词汇题（13 题，每次抽取 7 题）
-- ========================

INSERT INTO `assessment_questions` (`type`, `question_text`, `options_json`, `correct_answer`, `sort_order`, `difficulty`, `cefr_level`) VALUES

-- A1-Vocab-13
('vocab',
 'Choose the word that means the same as "happy":',
 '[{"key":"A","text":"Sad"},{"key":"B","text":"Angry"},{"key":"C","text":"Tired"},{"key":"D","text":"Glad"}]',
 'D', 13, 0.7000, 'A1'),

-- A1-Vocab-14
('vocab',
 'Which word means "very big"?',
 '[{"key":"A","text":"Huge"},{"key":"B","text":"Tiny"},{"key":"C","text":"Quick"},{"key":"D","text":"Slow"}]',
 'A', 14, 0.8000, 'A1'),

-- A2-Vocab-15
('vocab',
 '"Essential" most nearly means:',
 '[{"key":"A","text":"Unnecessary"},{"key":"B","text":"Important"},{"key":"C","text":"Expensive"},{"key":"D","text":"Difficult"}]',
 'B', 15, 1.0000, 'A2'),

-- A2-Vocab-16
('vocab',
 'Choose the synonym of "begin":',
 '[{"key":"A","text":"Finish"},{"key":"B","text":"Stop"},{"key":"C","text":"Start"},{"key":"D","text":"Pause"}]',
 'C', 16, 0.9000, 'A2'),

-- B1-Vocab-17
('vocab',
 'The word "abundant" means:',
 '[{"key":"A","text":"Plentiful"},{"key":"B","text":"Rare"},{"key":"C","text":"Dangerous"},{"key":"D","text":"Expensive"}]',
 'A', 17, 1.3000, 'B1'),

-- B1-Vocab-18
('vocab',
 'Someone who is "candid" is being:',
 '[{"key":"A","text":"Secretive"},{"key":"B","text":"Rude"},{"key":"C","text":"Confused"},{"key":"D","text":"Honest"}]',
 'D', 18, 1.4000, 'B1'),

-- B1-Vocab-19
('vocab',
 'What does "inevitable" mean?',
 '[{"key":"A","text":"Avoidable"},{"key":"B","text":"Unavoidable"},{"key":"C","text":"Desirable"},{"key":"D","text":"Unlikely"}]',
 'B', 19, 1.5000, 'B1'),

-- B2-Vocab-20
('vocab',
 '"Ambiguous" most nearly means:',
 '[{"key":"A","text":"Clear"},{"key":"B","text":"Obvious"},{"key":"C","text":"Unclear"},{"key":"D","text":"Simple"}]',
 'C', 20, 1.7000, 'B2'),

-- B2-Vocab-21
('vocab',
 'A "pragmatic" approach is one that is:',
 '[{"key":"A","text":"Practical"},{"key":"B","text":"Theoretical"},{"key":"C","text":"Emotional"},{"key":"D","text":"Artistic"}]',
 'A', 21, 1.8000, 'B2'),

-- B2-Vocab-22
('vocab',
 'To "scrutinize" something means to:',
 '[{"key":"A","text":"Ignore it"},{"key":"B","text":"Destroy it"},{"key":"C","text":"Create it"},{"key":"D","text":"Examine it closely"}]',
 'D', 22, 1.9000, 'B2'),

-- C1-Vocab-23
('vocab',
 'What does "ubiquitous" mean?',
 '[{"key":"A","text":"Found everywhere"},{"key":"B","text":"Very small"},{"key":"C","text":"Extremely fast"},{"key":"D","text":"Quite expensive"}]',
 'A', 23, 2.0000, 'C1'),

-- C1-Vocab-24
('vocab',
 'The term "ephemeral" describes something that is:',
 '[{"key":"A","text":"Eternal"},{"key":"B","text":"Widespread"},{"key":"C","text":"Short-lived"},{"key":"D","text":"Complicated"}]',
 'C', 24, 2.1000, 'C1'),

-- C1-Vocab-25
('vocab',
 'A "sycophant" is someone who:',
 '[{"key":"A","text":"Leads others"},{"key":"B","text":"Flatters for personal gain"},{"key":"C","text":"Works independently"},{"key":"D","text":"Speaks multiple languages"}]',
 'B', 25, 2.3000, 'C1');

-- ========================
-- 语法题（13 题，每次抽取 7 题）
-- ========================

INSERT INTO `assessment_questions` (`type`, `question_text`, `options_json`, `correct_answer`, `sort_order`, `difficulty`, `cefr_level`) VALUES

-- A1-Grammar-26
('grammar',
 'She ___ a teacher at the local school.',
 '[{"key":"A","text":"are"},{"key":"B","text":"is"},{"key":"C","text":"am"},{"key":"D","text":"be"}]',
 'B', 26, 0.7000, 'A1'),

-- A1-Grammar-27
('grammar',
 'I don''t have ___ money with me right now.',
 '[{"key":"A","text":"some"},{"key":"B","text":"a"},{"key":"C","text":"any"},{"key":"D","text":"an"}]',
 'C', 27, 0.8000, 'A1'),

-- A2-Grammar-28
('grammar',
 'They ___ to the cinema last night.',
 '[{"key":"A","text":"went"},{"key":"B","text":"go"},{"key":"C","text":"gone"},{"key":"D","text":"going"}]',
 'A', 28, 1.0000, 'A2'),

-- A2-Grammar-29
('grammar',
 'This book is ___ than the one I read last week.',
 '[{"key":"A","text":"interesting"},{"key":"B","text":"most interesting"},{"key":"C","text":"more interest"},{"key":"D","text":"more interesting"}]',
 'D', 29, 1.1000, 'A2'),

-- B1-Grammar-30
('grammar',
 'She ___ in London for five years before she moved to Paris.',
 '[{"key":"A","text":"lived"},{"key":"B","text":"had lived"},{"key":"C","text":"has lived"},{"key":"D","text":"lives"}]',
 'B', 30, 1.4000, 'B1'),

-- B1-Grammar-31
('grammar',
 'If it ___ tomorrow, we will cancel the picnic.',
 '[{"key":"A","text":"rained"},{"key":"B","text":"will rain"},{"key":"C","text":"rains"},{"key":"D","text":"would rain"}]',
 'C', 31, 1.3000, 'B1'),

-- B1-Grammar-32
('grammar',
 'The woman ___ lives next door is a doctor.',
 '[{"key":"A","text":"who"},{"key":"B","text":"which"},{"key":"C","text":"what"},{"key":"D","text":"whose"}]',
 'A', 32, 1.5000, 'B1'),

-- B2-Grammar-33
('grammar',
 'The bridge ___ by a famous architect in 1890.',
 '[{"key":"A","text":"designs"},{"key":"B","text":"has designed"},{"key":"C","text":"is designing"},{"key":"D","text":"was designed"}]',
 'D', 33, 1.6000, 'B2'),

-- B2-Grammar-34
('grammar',
 'He said he ___ the report by Friday.',
 '[{"key":"A","text":"finishes"},{"key":"B","text":"would finish"},{"key":"C","text":"will finish"},{"key":"D","text":"is finishing"}]',
 'B', 34, 1.7000, 'B2'),

-- B2-Grammar-35
('grammar',
 'I wish I ___ more time to travel.',
 '[{"key":"A","text":"have"},{"key":"B","text":"will have"},{"key":"C","text":"had"},{"key":"D","text":"having"}]',
 'C', 35, 1.8000, 'B2'),

-- C1-Grammar-36
('grammar',
 'Not until the professor arrived ___ the real purpose of the experiment.',
 '[{"key":"A","text":"did we understand"},{"key":"B","text":"we understood"},{"key":"C","text":"we did understand"},{"key":"D","text":"understood we"}]',
 'A', 36, 2.1000, 'C1'),

-- C1-Grammar-37
('grammar',
 '___ from a distance, the painting appeared to be a photograph.',
 '[{"key":"A","text":"Seeing"},{"key":"B","text":"Having seen"},{"key":"C","text":"To see"},{"key":"D","text":"Seen"}]',
 'D', 37, 2.2000, 'C1'),

-- C1-Grammar-38
('grammar',
 'It was the lack of communication ___ caused the project to fail.',
 '[{"key":"A","text":"which"},{"key":"B","text":"that"},{"key":"C","text":"what"},{"key":"D","text":"who"}]',
 'B', 38, 2.3000, 'C1');

-- ========================
-- 阅读题（12 题，每次抽取 6 题）
-- ========================

INSERT INTO `assessment_questions` (`type`, `question_text`, `options_json`, `correct_answer`, `sort_order`, `difficulty`, `cefr_level`) VALUES

-- A1-Reading-39
('reading',
 'Read the text and answer:\n\n"James wakes up at 7:00 every morning. He eats breakfast, then walks to work. He starts work at 9:00."\n\nWhat time does James start work?',
 '[{"key":"A","text":"7:00"},{"key":"B","text":"8:00"},{"key":"C","text":"9:00"},{"key":"D","text":"10:00"}]',
 'C', 39, 0.8000, 'A1'),

-- A2-Reading-40
('reading',
 'Read the email and answer:\n\n"Hi Lisa, Thanks for inviting me to your party on Saturday. I''d love to come! What time should I arrive? Best, Amy"\n\nWhy did Amy write this email?',
 '[{"key":"A","text":"To accept an invitation"},{"key":"B","text":"To cancel a meeting"},{"key":"C","text":"To ask for directions"},{"key":"D","text":"To order something"}]',
 'A', 40, 1.0000, 'A2'),

-- A2-Reading-41
('reading',
 'Read the advertisement:\n\n"Summer Sale! All clothing items up to 50% off. This weekend only. Free shipping on orders over $50."\n\nHow much discount can you get on clothing?',
 '[{"key":"A","text":"10% off"},{"key":"B","text":"25% off"},{"key":"C","text":"$50 off"},{"key":"D","text":"Up to 50% off"}]',
 'D', 41, 1.1000, 'A2'),

-- B1-Reading-42
('reading',
 'Read the news article:\n\n"Local residents have expressed concerns about the proposed construction of a shopping mall near the city park. Environmental groups argue that the development would destroy a natural habitat that is home to several protected bird species. The city council will vote on the proposal next month."\n\nWhy are environmental groups concerned?',
 '[{"key":"A","text":"The mall would be too expensive"},{"key":"B","text":"The construction would destroy a natural habitat"},{"key":"C","text":"The mall would create too much traffic"},{"key":"D","text":"The park would be closed"}]',
 'B', 42, 1.4000, 'B1'),

-- B1-Reading-43
('reading',
 'Read the blog post:\n\n"Last summer, I decided to learn how to cook. I started with simple recipes like pasta and soup. Gradually, I moved on to more complex dishes. Now, a year later, I can cook a full three-course meal for my friends. The key was practicing a little bit every day."\n\nAccording to the writer, what was the key to learning to cook?',
 '[{"key":"A","text":"Practicing daily"},{"key":"B","text":"Taking expensive classes"},{"key":"C","text":"Watching cooking shows"},{"key":"D","text":"Buying professional equipment"}]',
 'A', 43, 1.3000, 'B1'),

-- B1-Reading-44
('reading',
 'Read the instructions:\n\n"To reset your password, first click on the Settings icon in the top right corner. Then select Account Security from the menu. Click Change Password and follow the on-screen instructions. You will need to verify your identity by entering a code sent to your email."\n\nWhat do you need to do FIRST to reset your password?',
 '[{"key":"A","text":"Enter a verification code"},{"key":"B","text":"Select Account Security"},{"key":"C","text":"Click the Settings icon"},{"key":"D","text":"Click Change Password"}]',
 'C', 44, 1.2000, 'B1'),

-- B2-Reading-45
('reading',
 'Read the opinion essay:\n\n"While social media platforms claim to bring people together, research increasingly suggests the opposite effect. Studies have shown that heavy social media users report higher levels of loneliness and anxiety compared to those who limit their usage. The curated nature of online content creates unrealistic expectations and fosters a culture of comparison that undermines genuine social connection."\n\nWhat is the author''s main argument?',
 '[{"key":"A","text":"Social media is too expensive for most users"},{"key":"B","text":"Social media platforms need better privacy controls"},{"key":"C","text":"Social media is mostly used by young people"},{"key":"D","text":"Social media may increase loneliness rather than connection"}]',
 'D', 45, 1.8000, 'B2'),

-- B2-Reading-46
('reading',
 'Read the scientific excerpt:\n\n"Photosynthesis is the process by which plants convert light energy into chemical energy. During this process, plants take in carbon dioxide from the atmosphere and release oxygen as a byproduct. Scientists estimate that photosynthetic organisms produce approximately 70% of the oxygen in Earth''s atmosphere, making them essential for sustaining life on our planet."\n\nWhat percentage of Earth''s oxygen is produced by photosynthetic organisms?',
 '[{"key":"A","text":"Approximately 70%"},{"key":"B","text":"Approximately 30%"},{"key":"C","text":"Approximately 50%"},{"key":"D","text":"Approximately 90%"}]',
 'A', 46, 1.9000, 'B2'),

-- B2-Reading-47
('reading',
 'Read the literary excerpt:\n\n"The old house stood at the end of the lane, its windows dark and its garden overgrown. Children in the neighborhood whispered stories about the mysterious owner who hadn''t been seen in twenty years. But on that particular autumn evening, a light appeared in one of the upstairs windows, and everything changed."\n\nWhat unusual event happened on the autumn evening?',
 '[{"key":"A","text":"Children visited the house"},{"key":"B","text":"A light appeared in a window"},{"key":"C","text":"The garden was cleaned"},{"key":"D","text":"The owner came outside"}]',
 'B', 47, 2.0000, 'B2'),

-- C1-Reading-48
('reading',
 'Read the academic journal excerpt:\n\n"The replication crisis in psychology has prompted a fundamental reevaluation of research methodologies across the social sciences. Meta-analyses reveal that a significant proportion of published findings fail to replicate under rigorous conditions, raising questions about publication bias, questionable research practices, and the over-reliance on null hypothesis significance testing as the primary metric for scientific validity."\n\nWhat is identified as a contributing factor to the replication crisis?',
 '[{"key":"A","text":"Lack of funding for research"},{"key":"B","text":"Too few researchers in psychology"},{"key":"C","text":"Over-reliance on null hypothesis significance testing"},{"key":"D","text":"Poor laboratory equipment"}]',
 'C', 48, 2.3000, 'C1'),

-- C1-Reading-49
('reading',
 'Read the historical analysis:\n\n"The fall of the Roman Empire was not a singular event but rather a gradual process spanning several centuries. Economic decline, military overextension, political instability, and cultural transformation all contributed to what historians now describe as a complex transition rather than an abrupt collapse. This nuanced understanding challenges the traditional narrative of barbarian invasions as the sole cause of Rome''s demise."\n\nHow do modern historians view the fall of the Roman Empire?',
 '[{"key":"A","text":"As caused solely by barbarian invasions"},{"key":"B","text":"As a rapid and sudden collapse"},{"key":"C","text":"As primarily an economic failure"},{"key":"D","text":"As a gradual transition with multiple causes"}]',
 'D', 49, 2.4000, 'C1'),

-- C1-Reading-50
('reading',
 'Read the philosophical argument:\n\n"The notion of free will presupposes that individuals possess the capacity to make choices independent of deterministic causal chains. However, if every decision can be traced to prior neurological events that themselves follow physical laws, the space for genuine autonomy appears to evaporate. Compatibilists attempt to reconcile this tension by redefining free will as the capacity to act according to one''s own motivations, regardless of whether those motivations themselves are determined."\n\nWhat is the compatibilist view of free will?',
 '[{"key":"A","text":"Free will is an illusion that should be abandoned"},{"key":"B","text":"All human actions are completely random"},{"key":"C","text":"Decisions are made by the soul not the brain"},{"key":"D","text":"Free will means acting according to one''s own motivations"}]',
 'D', 50, 2.5000, 'C1');
