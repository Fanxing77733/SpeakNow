package com.es.gamification.dto;

import lombok.Data;

@Data
public class GroupVO {
    private Long id;
    private String name;
    private String description;
    private int memberCount;
    private String visibility;
    private boolean joined;
}
