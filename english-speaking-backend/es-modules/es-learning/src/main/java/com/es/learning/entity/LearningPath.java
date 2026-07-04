package com.es.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("learning_paths")
public class LearningPath {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String pathType;   // exam_middle/cet4_6/daily/custom
    private String status;     // active/paused/completed
    private Integer currentPhase;
    private BigDecimal progressPct;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
