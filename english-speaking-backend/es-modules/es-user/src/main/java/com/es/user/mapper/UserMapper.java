package com.es.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.user.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户表 Mapper，继承 MyBatis-Plus BaseMapper
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
