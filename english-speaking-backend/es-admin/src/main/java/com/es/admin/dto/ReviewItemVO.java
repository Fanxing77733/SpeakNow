package com.es.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewItemVO {

    private Long id;
    private String contentType;
    private Long contentId;
    private Long userId;
    private String userNickname;
    private String contentText;
    private Double aiScore;
    private String aiTags;
    private String status;
    private LocalDateTime createdAt;
}
