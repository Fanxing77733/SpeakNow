package com.es.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 用户提交答案请求体
 */
@Data
public class SubmitAnswersDTO {

    /** 答案列表，至少提交 1 题 */
    @NotEmpty(message = "请至少回答一题")
    @Size(max = 20, message = "题目数量不能超过20题")
    @Valid
    private List<AnswerItem> answers;

    /**
     * 单个答案项，仅接收 questionId 和 selectedKey，忽略任何额外字段
     */
    @Data
    public static class AnswerItem {

        /** 题目 ID */
        private Integer questionId;

        /** 用户选择的选项 key: A/B/C/D */
        private String selectedKey;
    }
}
