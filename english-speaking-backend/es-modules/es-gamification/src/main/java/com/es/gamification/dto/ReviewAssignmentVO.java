package com.es.gamification.dto;

import lombok.Data;

/**
 * 待审阅列表项 VO
 */
@Data
public class ReviewAssignmentVO {
    private Long id;
    private Long recordingId;
    private String sentencePreview;
    private String userName;
    private String status;
    private String assignedAt;
}
