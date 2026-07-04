-- V21: 管理后台 — 内容审核队列 + 运营操作日志
CREATE TABLE content_review_queue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content_type VARCHAR(30) NOT NULL COMMENT '内容类型: GROUP_POST/GROUP_COMMENT/PEER_REVIEW/CHALLENGE_SUBMISSION',
    content_id BIGINT NOT NULL COMMENT '关联内容 ID',
    user_id BIGINT NOT NULL COMMENT '内容作者',
    content_text TEXT COMMENT '内容文本（截取前 500 字符）',
    ai_score DECIMAL(3,2) COMMENT 'AI 预审风险评分 0-1',
    ai_tags JSON COMMENT 'AI 检测标签',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/REJECTED/SKIPPED',
    reviewer_id BIGINT COMMENT '审核人',
    review_comment VARCHAR(500) COMMENT '审核意见/驳回原因',
    reviewed_at DATETIME COMMENT '审核时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_content_type (content_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容审核队列';

CREATE TABLE operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operator_id BIGINT NOT NULL COMMENT '操作人',
    action VARCHAR(50) NOT NULL COMMENT '操作类型: BAN_USER/UNBAN_USER/APPROVE_CONTENT/REJECT_CONTENT',
    target_type VARCHAR(30) COMMENT '目标类型: USER/CONTENT_REVIEW',
    target_id BIGINT COMMENT '目标 ID',
    detail JSON COMMENT '操作详情',
    ip VARCHAR(45),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_operator (operator_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运营操作日志';
