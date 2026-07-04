-- =============================================================
-- V18: PK对战 + 排行榜种子数据（V2.0）
-- =============================================================

-- =============================================================
-- 1. 积分种子数据（供排行榜和积分历史展示）
-- =============================================================

-- 为 userId=1 模拟积分记录
INSERT INTO user_points (user_id, points, reason, reference_id, created_at) VALUES
(1, 5, '完成一次跟读评测', 1, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(1, 8, '完成一轮情景对话', 1, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(1, 5, '完成一次跟读评测', 2, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 8, '完成一轮情景对话', 2, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(1, 5, '完成一次跟读评测', 3, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(1, 30, 'PK对战获胜', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 15, '连续打卡第7天额外奖励', NULL, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 5, '完成一次跟读评测', 4, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, 8, '完成一轮情景对话', 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 10, 'PK对战失败', 2, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 5, '完成一次跟读评测', 5, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 20, 'PK对战平局', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 8, '完成一轮情景对话', 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 5, '完成一次跟读评测', 6, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 30, 'PK对战获胜', 4, DATE_SUB(NOW(), INTERVAL 0 DAY));

-- 为 userId=2 模拟积分记录
INSERT INTO user_points (user_id, points, reason, reference_id, created_at) VALUES
(2, 5, '完成一次跟读评测', 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 5, '完成一次跟读评测', 2, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(2, 8, '完成一轮情景对话', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 30, 'PK对战获胜', 5, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2, 5, '完成一次跟读评测', 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 8, '完成一轮情景对话', 2, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 30, 'PK对战获胜', 6, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 5, '完成一次跟读评测', 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 8, '完成一轮情景对话', 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 20, 'PK对战平局', 7, DATE_SUB(NOW(), INTERVAL 0 DAY));

-- 为 userId=3 模拟积分记录
INSERT INTO user_points (user_id, points, reason, reference_id, created_at) VALUES
(3, 5, '完成一次跟读评测', 1, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(3, 8, '完成一轮情景对话', 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(3, 5, '完成一次跟读评测', 2, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(3, 10, 'PK对战失败', 8, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3, 5, '完成一次跟读评测', 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 8, '完成一轮情景对话', 2, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 5, '完成一次跟读评测', 4, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 30, 'PK对战获胜', 9, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 8, '完成一轮情景对话', 3, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 为 userId=4 模拟积分记录
INSERT INTO user_points (user_id, points, reason, reference_id, created_at) VALUES
(4, 5, '完成一次跟读评测', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(4, 5, '完成一次跟读评测', 2, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(4, 30, 'PK对战获胜', 10, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 8, '完成一轮情景对话', 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(4, 5, '完成一次跟读评测', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 8, '完成一轮情景对话', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 10, 'PK对战失败', 11, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 为 userId=5 模拟积分记录
INSERT INTO user_points (user_id, points, reason, reference_id, created_at) VALUES
(5, 5, '完成一次跟读评测', 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, 8, '完成一轮情景对话', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5, 20, 'PK对战平局', 12, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 5, '完成一次跟读评测', 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 30, 'PK对战获胜', 13, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- =============================================================
-- 2. PK对战种子数据（已完成的对战记录）
-- =============================================================

-- 创建几个已完成的对战记录，这样PK页面和排行榜有数据可展示
INSERT INTO pk_matches (player1_id, player2_id, word_list_id, status, player1_score, player2_score, player1_submitted_at, player2_submitted_at, result, judged_at, created_at) VALUES
(1, 2, 1, 'completed', 92.50, 85.00, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 2 MINUTE, 'p1_win', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 3 MINUTE, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 3, 1, 'completed', 78.00, 88.50, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 3 MINUTE, 'p2_win', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 4 MINUTE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 4, 2, 'completed', 90.00, 90.00, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 1 MINUTE, 'draw', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 2 MINUTE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 5, 2, 'completed', 95.00, 72.00, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 2 MINUTE, 'p1_win', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 MINUTE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 4, 1, 'completed', 76.50, 81.00, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 1 MINUTE, 'p2_win', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 MINUTE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 5, 3, 'completed', 88.00, 82.50, DATE_SUB(NOW(), INTERVAL 0 DAY) - INTERVAL 6 HOUR, DATE_SUB(NOW(), INTERVAL 0 DAY) - INTERVAL 6 HOUR + INTERVAL 2 MINUTE, 'p1_win', DATE_SUB(NOW(), INTERVAL 0 DAY) - INTERVAL 6 HOUR + INTERVAL 3 MINUTE, DATE_SUB(NOW(), INTERVAL 0 DAY) - INTERVAL 6 HOUR);

-- =============================================================
-- 3. 勋章种子数据（示例勋章）
-- =============================================================

INSERT INTO user_badges (user_id, badge_type, badge_name, earned_at) VALUES
(1, 'first_practice', '初出茅庐', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(1, 'first_conversation', '初次交谈', DATE_SUB(NOW(), INTERVAL 11 DAY)),
(1, 'practice_master', '练习达人', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, 'streak_7', '坚持不懈', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 'first_practice', '初出茅庐', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 'conversation_pro', '对话高手', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 'first_practice', '初出茅庐', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(3, 'first_conversation', '初次交谈', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 'first_practice', '初出茅庐', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(5, 'first_practice', '初出茅庐', DATE_SUB(NOW(), INTERVAL 6 DAY));

-- =============================================================
-- 4. 小组默认数据（确保ID=1存在）
-- =============================================================

-- 如果 GamificationServiceImpl.initDefaultGroups() 未执行，手动补一条
INSERT INTO study_groups (id, name, description, owner_id, visibility, member_count, topic_push_enabled, created_at)
SELECT 1, '每日英语打卡群', '坚持每日打卡，互相监督学习', 1, 'public', 5, 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM study_groups WHERE id = 1);

INSERT INTO study_groups (id, name, description, owner_id, visibility, member_count, topic_push_enabled, created_at)
SELECT 2, '四六级口语冲刺', '备战四六级口语考试，一起刷题', 2, 'public', 3, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM study_groups WHERE id = 2);

INSERT INTO study_groups (id, name, description, owner_id, visibility, member_count, topic_push_enabled, created_at)
SELECT 3, '商务英语交流组', '职场英语口语练习与交流', 1, 'private', 8, 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM study_groups WHERE id = 3);
