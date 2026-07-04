-- =============================================================
-- V9: 初始化游戏化与社区表（V2.0）
-- =============================================================

CREATE TABLE IF NOT EXISTS user_badges (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id     BIGINT       NOT NULL COMMENT '用户ID',
    badge_type  VARCHAR(50)  NOT NULL COMMENT '勋章类型',
    badge_name  VARCHAR(100) NOT NULL COMMENT '勋章名称',
    earned_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间(UTC)',
    CONSTRAINT fk_badge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_badge_user (user_id),
    INDEX idx_badge_type (badge_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户勋章表（V2.0）';

CREATE TABLE IF NOT EXISTS user_points (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    user_id      BIGINT       NOT NULL COMMENT '用户ID',
    points       INT          NOT NULL COMMENT '积分变化（正数为获得，负数为消费）',
    reason       VARCHAR(100) NOT NULL COMMENT '积分原因',
    reference_id BIGINT       NULL     COMMENT '关联业务ID',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '时间(UTC)',
    CONSTRAINT fk_point_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_point_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户积分表（V2.0）';

CREATE TABLE IF NOT EXISTS study_groups (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    name         VARCHAR(100) NOT NULL COMMENT '小组名称',
    description  TEXT         NULL     COMMENT '小组简介',
    owner_id     BIGINT       NOT NULL COMMENT '创建者ID',
    visibility   ENUM('public','private') NOT NULL DEFAULT 'public' COMMENT '可见性',
    member_count INT          NOT NULL DEFAULT 1 COMMENT '成员数（冗余）',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    CONSTRAINT fk_group_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_group_owner (owner_id),
    INDEX idx_group_visibility (visibility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习小组表（V2.0）';

CREATE TABLE IF NOT EXISTS group_members (
    id        BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    group_id  BIGINT   NOT NULL COMMENT '小组ID',
    user_id   BIGINT   NOT NULL COMMENT '用户ID',
    role      ENUM('owner','admin','member') NOT NULL DEFAULT 'member' COMMENT '角色',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间(UTC)',
    CONSTRAINT fk_member_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_member_group_user (group_id, user_id),
    INDEX idx_member_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小组成员表（V2.0）';

CREATE TABLE IF NOT EXISTS group_challenges (
    id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    group_id       BIGINT       NOT NULL COMMENT '小组ID',
    created_by     BIGINT       NOT NULL COMMENT '发起者ID',
    title          VARCHAR(200) NOT NULL COMMENT '挑战标题',
    content_id     INT          NOT NULL COMMENT '跟读内容ID',
    starts_at      DATETIME     NOT NULL COMMENT '开始时间',
    ends_at        DATETIME     NOT NULL COMMENT '截止时间',
    status         ENUM('active','ended') NOT NULL DEFAULT 'active' COMMENT '状态',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    CONSTRAINT fk_challenge_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_challenge_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_challenge_group (group_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小组挑战表（V2.0）';
