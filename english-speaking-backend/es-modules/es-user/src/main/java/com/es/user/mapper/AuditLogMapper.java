package com.es.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.user.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}
