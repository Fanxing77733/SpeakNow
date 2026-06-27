package com.es.practice.dto;

import lombok.Data;

/**
 * 开始对话会话请求 DTO
 */
@Data
public class StartSessionDTO {

    /** 对话场景: self_intro / campus_life / restaurant */
    private String scene;

    /** 难度等级: beginner / intermediate / advanced */
    private String difficulty;
}
