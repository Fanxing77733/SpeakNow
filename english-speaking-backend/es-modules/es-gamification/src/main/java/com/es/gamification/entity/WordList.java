package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("word_lists")
public class WordList {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    private String wordsJson;
    private String difficulty;
    private Integer wordCount;
    private LocalDateTime createdAt;
}
