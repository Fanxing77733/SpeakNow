-- =============================================================
-- V13: 单词PK对战 — 单词列表与对战记录（V2.0）
-- =============================================================

CREATE TABLE IF NOT EXISTS word_lists (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    name         VARCHAR(100) NOT NULL COMMENT '单词列表名称',
    description  TEXT         NULL     COMMENT '描述',
    words_json   JSON         NOT NULL COMMENT '单词列表 ["apple","banana",...]',
    difficulty   ENUM('beginner','intermediate','advanced') NOT NULL COMMENT '难度',
    word_count   INT          NOT NULL DEFAULT 0 COMMENT '单词数量',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    INDEX idx_wordlist_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单词列表表（V2.0）';

CREATE TABLE IF NOT EXISTS pk_matches (
    id                   BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    player1_id           BIGINT       NOT NULL COMMENT '玩家1用户ID',
    player2_id           BIGINT       NULL     COMMENT '玩家2用户ID（匹配后填入）',
    word_list_id         BIGINT       NOT NULL COMMENT '单词列表ID',
    status               ENUM('waiting','matched','p1_submitted','p2_submitted','judging','completed','timeout','cancelled') NOT NULL DEFAULT 'waiting' COMMENT '对战状态',
    player1_score        DECIMAL(5,2) NULL     COMMENT '玩家1得分',
    player2_score        DECIMAL(5,2) NULL     COMMENT '玩家2得分',
    player1_submitted_at DATETIME     NULL     COMMENT '玩家1提交时间(UTC)',
    player2_submitted_at DATETIME     NULL     COMMENT '玩家2提交时间(UTC)',
    result               ENUM('p1_win','p2_win','draw') NULL COMMENT '对战结果',
    judged_at            DATETIME     NULL     COMMENT '判决时间(UTC)',
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    CONSTRAINT fk_pk_player1 FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pk_player2 FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pk_wordlist FOREIGN KEY (word_list_id) REFERENCES word_lists(id) ON DELETE CASCADE,
    INDEX idx_pk_status (status),
    INDEX idx_pk_player1 (player1_id),
    INDEX idx_pk_player2 (player2_id),
    INDEX idx_pk_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PK对战表（V2.0）';

-- 种子数据：3个默认单词列表
INSERT INTO word_lists (name, description, words_json, difficulty, word_count) VALUES
('基础词汇挑战', '适合初学者的常用英语单词，覆盖日常生活基本词汇。',
 '["apple","book","cat","dog","egg","fish","girl","house","ice","jump","king","love","moon","night","open","pen","queen","rain","sun","tree","umbrella","van","water","xray","yellow","zoo","happy","big","small","good"]',
 'beginner', 30),
('进阶词汇对决', '适合有一定基础的学习者，覆盖工作、学习场景常用词汇。',
 '["achieve","balance","challenge","demonstrate","efficient","flexible","generate","hypothesis","implement","justify","knowledge","leadership","motivate","negotiate","opportunity","professional","quality","resource","strategy","technique","unique","valuable","wisdom","analysis","budget","conference","deadline","evidence","framework","global"]',
 'intermediate', 30),
('高级词汇争霸', '适合高级学习者，覆盖学术、商务等正式场合词汇。',
 '["sophisticated","comprehensive","unprecedented","revolutionary","extraordinary","phenomenon","paradigm","infrastructure","sustainability","accountability","diversification","entrepreneurship","globalization","metamorphosis","perseverance","resilience","spontaneous","unanimous","versatile","widespread","ambiguous","bureaucratic","catastrophic","detrimental","elaborate","fluctuate","gregarious","hypothetical","indispensable","juxtapose"]',
 'advanced', 30);
