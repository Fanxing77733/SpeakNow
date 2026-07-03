package com.es.practice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SpeechTopicVO {
    private Integer id;
    private String title;
    private String description;
    private String category;
    private String difficulty;
    private Integer preparationSeconds;
    private Integer speechSecondsMin;
    private Integer speechSecondsMax;
}
