package com.es.assessment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 测评记录实体，映射 assessment_records 表
 */
@Data
@TableName("`assessment_records`")
public class AssessmentRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户 ID */
    private Long userId;

    /** 测评类型: fixed / adaptive */
    private String assessmentType;

    /** 总分 0-100 */
    private Integer totalScore;

    /** 词汇得分 0-100 */
    private Integer vocabScore;

    /** 语法得分 0-100 */
    private Integer grammarScore;

    /** 阅读得分 0-100 */
    private Integer readingScore;

    /** 听力得分 0-100 */
    private Integer listeningScore;

    /** 测评结果等级: beginner / intermediate / advanced */
    private String resultLevel;

    /** CEFR 等级 (V2.0) */
    @TableField("cefr_level")
    private String cefrLevel;

    /** 作答明细 JSON: [{"questionId":1,"userAnswer":"A","isCorrect":true},...] */
    private String answersJson;

    /** IRT 能力估计值 (V2.0) */
    @TableField("ability_theta")
    private BigDecimal abilityTheta;

    /** 测评时间 UTC */
    private LocalDateTime createdAt;
}
