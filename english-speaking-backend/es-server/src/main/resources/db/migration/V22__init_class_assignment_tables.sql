-- V22: 教师端 — 班级 + 作业 + 提交表
CREATE TABLE class_info (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT NOT NULL COMMENT '教师用户 ID',
    name VARCHAR(100) NOT NULL COMMENT '班级名称',
    description VARCHAR(500) COMMENT '班级描述',
    invite_code VARCHAR(20) NOT NULL UNIQUE COMMENT '邀请码',
    student_count INT NOT NULL DEFAULT 0 COMMENT '学生人数（冗余）',
    max_students INT NOT NULL DEFAULT 200 COMMENT '上限',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/DISBANDED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    INDEX idx_invite_code (invite_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级';

CREATE TABLE class_student (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL COMMENT '学生用户 ID',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_class_student (class_id, student_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级学生';

CREATE TABLE assignment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL COMMENT '作业标题',
    description TEXT COMMENT '作业说明（文字）',
    audio_url VARCHAR(500) COMMENT '语音说明 URL',
    assignment_type VARCHAR(30) NOT NULL COMMENT 'PRONOUNCE/CONVERSATION/GRAMMAR',
    content_id BIGINT COMMENT '关联跟读内容/场景 ID',
    deadline DATETIME COMMENT '截止日期',
    publish_type VARCHAR(20) NOT NULL DEFAULT 'IMMEDIATE' COMMENT 'IMMEDIATE/SCHEDULED',
    publish_at DATETIME COMMENT '定时发布时间',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT/PUBLISHED/CLOSED',
    submit_count INT NOT NULL DEFAULT 0 COMMENT '提交人数',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_class (class_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业';

CREATE TABLE assignment_submission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    audio_url VARCHAR(500) COMMENT '录音 URL',
    text_content TEXT COMMENT '文本内容（语法练习）',
    practice_record_id BIGINT COMMENT '关联练习记录',
    score DECIMAL(5,2) COMMENT 'AI 评分',
    teacher_review VARCHAR(1000) COMMENT '教师点评（文字）',
    teacher_audio_url VARCHAR(500) COMMENT '教师语音点评 URL',
    teacher_score INT COMMENT '教师评分 1-100',
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' COMMENT 'SUBMITTED/REVIEWED',
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    UNIQUE KEY uk_assignment_student (assignment_id, student_id),
    INDEX idx_assignment (assignment_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业提交';
