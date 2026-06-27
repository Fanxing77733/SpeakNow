package com.es.learning.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.learning.entity.StudySession;
import org.apache.ibatis.annotations.Mapper;

/**
 * 学习会话记录 Mapper
 */
@Mapper
public interface StudySessionMapper extends BaseMapper<StudySession> {
}
