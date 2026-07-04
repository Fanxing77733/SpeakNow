package com.es.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("learning_path_tasks")
public class LearningPathTask {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long pathId;
    private Integer phase;
    private String taskName;     // 任务名称
    private String taskType;     // practice/conversation/grammar/vocab
    private Integer taskRefId;
    private LocalDate scheduledDate;
    private String status;       // pending/completed/skipped
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
