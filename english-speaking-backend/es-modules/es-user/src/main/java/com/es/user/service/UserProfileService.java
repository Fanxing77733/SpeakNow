package com.es.user.service;

import com.es.user.dto.PortraitVO;

/**
 * 用户画像服务接口（V2.0）
 */
public interface UserProfileService {

    /**
     * 获取用户四维画像数据
     * @param userId 用户ID
     * @return 画像VO，若画像不存在则返回空数据
     */
    PortraitVO getPortrait(Long userId);
}
