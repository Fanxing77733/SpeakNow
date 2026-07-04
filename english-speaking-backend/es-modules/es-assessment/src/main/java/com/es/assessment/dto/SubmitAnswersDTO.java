package com.es.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 用户提交答案请求体（V3.0：30 题测评）
 */
@Data
public class SubmitAnswersDTO {

    /** 答案列表 */
    @NotEmpty(message = "请至少回答一题")
    @Size(max = 30, message = "题目数量不能超过30题")
    @Valid
    private List<AnswerItem> answers;

    @Data
    public static class AnswerItem {

        /** 题目 ID */
        private Integer questionId;

        /** 用户选择的选项 key: A/B/C/D，超时为空字符串 */
        private String selectedKey;
    }
}
