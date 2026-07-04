-- =============================================================
-- V6: 初始化语法错题本表（V2.0）
-- =============================================================

CREATE TABLE IF NOT EXISTS grammar_error_book (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id         BIGINT       NOT NULL COMMENT '用户ID',
    original_text   TEXT         NOT NULL COMMENT '用户原始文本',
    corrected_text  TEXT         NOT NULL COMMENT '纠正后文本',
    error_type      ENUM('spelling','grammar','word_choice','sentence') NOT NULL COMMENT '错误类型',
    explanation     TEXT         NULL     COMMENT '中文语法解释',
    source          ENUM('practice','conversation','manual') NOT NULL DEFAULT 'manual' COMMENT '错误来源',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间(UTC)',
    CONSTRAINT fk_grammar_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_grammar_user_type (user_id, error_type),
    INDEX idx_grammar_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='语法错题本表（V2.0）';
