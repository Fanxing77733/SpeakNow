package com.es.practice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.practice.entity.ConversationMessage;
import org.apache.ibatis.annotations.Mapper;

/**
 * 对话消息 Mapper
 */
@Mapper
public interface ConversationMessageMapper extends BaseMapper<ConversationMessage> {
}
