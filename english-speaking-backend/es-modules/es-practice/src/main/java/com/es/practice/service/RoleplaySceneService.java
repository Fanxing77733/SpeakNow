package com.es.practice.service;

import com.es.practice.dto.RoleplayHistoryVO;
import com.es.practice.dto.RoleplaySceneVO;

import java.util.List;

public interface RoleplaySceneService {

    /** 获取所有启用的角色扮演场景 */
    List<RoleplaySceneVO> listScenes(String difficulty);

    /** 根据 sceneKey 获取场景配置 */
    RoleplaySceneVO getSceneByKey(String sceneKey);

    /** 获取用户角色扮演历史记录（分页） */
    List<RoleplayHistoryVO> getHistory(Long userId, int page, int size);

    /** 历史记录总数 */
    long countHistory(Long userId);
}
