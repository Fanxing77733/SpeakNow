package com.es.gamification.service;

import com.es.gamification.dto.ShopItemVO;

import java.util.List;

/**
 * 积分商城服务接口（V2.0）
 */
public interface PointsShopService {

    /** 获取可用道具列表 */
    List<ShopItemVO> getShopItems(Long userId);

    /** 购买道具 */
    void purchaseItem(Long userId, Long itemId);

    /** 获取我的道具 */
    List<ShopItemVO> getMyItems(Long userId);
}
