package com.es.practice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.practice.entity.PracticeRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 跟读训练记录 Mapper
 */
@Mapper
public interface PracticeRecordMapper extends BaseMapper<PracticeRecord> {
}
