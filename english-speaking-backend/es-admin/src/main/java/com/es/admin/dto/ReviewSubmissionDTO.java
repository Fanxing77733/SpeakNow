package com.es.admin.dto;

import lombok.Data;

@Data
public class ReviewSubmissionDTO {

    private String teacherReview;
    private String teacherAudioUrl;
    private Integer teacherScore;
}
