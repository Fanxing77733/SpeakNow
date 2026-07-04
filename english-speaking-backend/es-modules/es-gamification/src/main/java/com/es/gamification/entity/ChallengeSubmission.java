package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("challenge_submissions")
public class ChallengeSubmission {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long challengeId;
    private Long userId;
    private Long practiceId;
    private BigDecimal score;
    private Integer submissionNumber;
    private LocalDateTime submittedAt;
}
