package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("review_assignments")
public class ReviewAssignment {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long recordingId;
    private Long reviewerId;
    private String status;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;
}
