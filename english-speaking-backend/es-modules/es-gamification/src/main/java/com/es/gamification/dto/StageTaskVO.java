package com.es.gamification.dto;

import lombok.Data;

@Data
public class StageTaskVO {
    private int index;
    private String name;
    private String type;
    private String description;
    private boolean completed;
}
