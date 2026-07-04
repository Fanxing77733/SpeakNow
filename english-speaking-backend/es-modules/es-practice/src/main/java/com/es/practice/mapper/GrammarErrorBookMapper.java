package com.es.practice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.practice.entity.GrammarErrorBook;
import org.apache.ibatis.annotations.Mapper;

/**
 * 语法错题本数据访问接口（V2.0）
 */
@Mapper
public interface GrammarErrorBookMapper extends BaseMapper<GrammarErrorBook> {
}
