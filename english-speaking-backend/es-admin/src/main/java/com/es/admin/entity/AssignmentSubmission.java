package com.es.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("assignment_submission")
public class AssignmentSubmission {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long assignmentId;
    private Long studentId;
    private String audioUrl;
    private String textContent;
    private Long practiceRecordId;
    private BigDecimal score;
    private String teacherReview;
    private String teacherAudioUrl;
    private Integer teacherScore;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
}
