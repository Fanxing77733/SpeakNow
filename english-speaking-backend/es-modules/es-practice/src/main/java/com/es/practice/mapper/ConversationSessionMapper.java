package com.es.practice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.practice.entity.ConversationSession;
import org.apache.ibatis.annotations.Mapper;

/**
 * 对话会话 Mapper
 */
@Mapper
public interface ConversationSessionMapper extends BaseMapper<ConversationSession> {
}
