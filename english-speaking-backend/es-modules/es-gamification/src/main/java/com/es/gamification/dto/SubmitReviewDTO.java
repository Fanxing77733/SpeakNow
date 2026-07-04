package com.es.gamification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 提交评价请求 DTO
 */
@Data
public class SubmitReviewDTO {
    @NotNull
    private Long assignmentId;

    @Min(1)
    @Max(100)
    private int score;

    private String comment;
}
