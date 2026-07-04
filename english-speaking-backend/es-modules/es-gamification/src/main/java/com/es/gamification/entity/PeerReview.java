package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("peer_reviews")
public class PeerReview {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long assignmentId;
    private Long recordingId;
    private Long reviewerId;
    private Integer score;
    private String comment;
    private Integer isSuspicious;
    private java.math.BigDecimal deviationPct;
    private LocalDateTime createdAt;
}
