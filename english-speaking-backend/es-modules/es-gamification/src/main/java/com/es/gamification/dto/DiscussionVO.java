package com.es.gamification.dto;

import lombok.Data;

@Data
public class DiscussionVO {
    private Long id;
    private Long userId;
    private String userName;
    private String content;
    private String createdAt;
}
