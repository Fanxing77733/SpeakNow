package com.es.assessment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 测评题库实体，映射 assessment_questions 表
 */
@Data
@TableName("`assessment_questions`")
public class AssessmentQuestion {

    @TableId(type = IdType.AUTO)
    private Integer id;

    /** 题目类型: vocab / grammar / reading / listening */
    private String type;

    /** 题目文本 */
    private String questionText;

    /** 选项列表 JSON: [{"key":"A","text":"..."},...] */
    private String optionsJson;

    /** 正确答案，绝不可返回给前端 */
    @TableField("correct_answer")
    private String correctAnswer;

    /** 排序序号 */
    private Integer sortOrder;

    /** IRT 难度参数 */
    private BigDecimal difficulty;

    /** CEFR 等级: A1-C2 */
    private String cefrLevel;
}
