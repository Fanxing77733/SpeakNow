package com.es.gamification.dto;

import lombok.Data;

@Data
public class ChallengeVO {
    private Long id;
    private String title;
    private String description;
    private int contentId;
    private String contentText;
    private int durationHours;
    private int maxSubmissions;
    private String status;
    private String startsAt;
    private String endsAt;
    private int participantCount;
    private int submissionCount;
    private boolean userSubmitted;
    private int userSubmissionCount;
    private Double userBestScore;
    private Double myBestScore;
    private Integer myRank;
    private String bestSubmissionName;
}
