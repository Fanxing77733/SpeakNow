package com.es.practice.dto;

import lombok.Data;

/**
 * 开始对话会话请求 DTO
 */
@Data
public class StartSessionDTO {

    /** 对话场景: self_intro / campus_life / restaurant / rp_* */
    private String scene;

    /** 难度等级: beginner / intermediate / advanced */
    private String difficulty;

    /** 角色扮演场景ID（可选，传入时从DB读取配置） */
    private Long roleplaySceneId;
}
