package com.es.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.user.entity.UserProfile;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户画像数据访问接口（V2.0）
 */
@Mapper
public interface UserProfileMapper extends BaseMapper<UserProfile> {
}
