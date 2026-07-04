package com.es.gamification.dto;

import lombok.Data;

/**
 * 单词列表 VO
 */
@Data
public class WordListVO {
    private Long id;
    private String name;
    private String description;
    private String difficulty;
    private int wordCount;
}
