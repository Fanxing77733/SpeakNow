package com.es.assessment.service;

import com.es.assessment.dto.AssessmentResultVO;
import com.es.assessment.dto.QuestionVO;
import com.es.assessment.dto.SubmitAnswersDTO;

import java.util.List;

/**
 * 智能测评业务逻辑接口
 */
public interface AssessmentService {

    /** 获取固定测评题目列表（20 题，按类型各 5 题，已过滤 correct_answer） */
    List<QuestionVO> getFixedQuestions();

    /** 提交测评答案，计算分数、定级、保存记录、更新用户等级 */
    AssessmentResultVO submitAnswers(Long userId, SubmitAnswersDTO dto);
}
