package com.es.assessment.dto;

import lombok.Data;

/**
 * 返回给前端的题目视图对象（白名单字段，绝不包含 correct_answer）
 */
@Data
public class QuestionVO {

    /** 题目 ID */
    private Integer id;

    /** 题目类型: vocab / grammar / reading / listening */
    private String type;

    /** 题目文本 */
    private String questionText;

    /** 选项列表 JSON: [{"key":"A","text":"..."},...] */
    private String optionsJson;

    /** 排序序号 */
    private Integer sortOrder;
}
