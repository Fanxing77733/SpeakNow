package com.es.gamification.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.gamification.entity.UserPoints;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserPointsMapper extends BaseMapper<UserPoints> {
}
