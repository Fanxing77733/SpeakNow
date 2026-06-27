package com.es.assessment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.assessment.entity.AssessmentQuestion;
import org.apache.ibatis.annotations.Mapper;

/**
 * 测评题库 Mapper
 */
@Mapper
public interface AssessmentQuestionMapper extends BaseMapper<AssessmentQuestion> {
}
