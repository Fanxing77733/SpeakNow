package com.es.gamification.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.gamification.dto.ShopItemVO;
import com.es.gamification.entity.ShopItem;
import com.es.gamification.entity.UserPoints;
import com.es.gamification.entity.UserShopRecord;
import com.es.gamification.mapper.ShopItemMapper;
import com.es.gamification.mapper.UserPointsMapper;
import com.es.gamification.mapper.UserShopRecordMapper;
import com.es.gamification.service.PointsShopService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PointsShopServiceImpl implements PointsShopService {

    private final ShopItemMapper shopItemMapper;
    private final UserShopRecordMapper shopRecordMapper;
    private final UserPointsMapper userPointsMapper;
    private final JdbcTemplate jdbcTemplate;

    public PointsShopServiceImpl(ShopItemMapper shopItemMapper, UserShopRecordMapper shopRecordMapper,
                                  UserPointsMapper userPointsMapper, JdbcTemplate jdbcTemplate) {
        this.shopItemMapper = shopItemMapper;
        this.shopRecordMapper = shopRecordMapper;
        this.userPointsMapper = userPointsMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<ShopItemVO> getShopItems(Long userId) {
        List<ShopItem> items = shopItemMapper.selectList(
                new LambdaQueryWrapper<ShopItem>().eq(ShopItem::getIsActive, 1));

        Set<Long> purchasedIds = shopRecordMapper.selectList(
                new LambdaQueryWrapper<UserShopRecord>().eq(UserShopRecord::getUserId, userId))
                .stream().map(UserShopRecord::getItemId).collect(Collectors.toSet());

        return items.stream().map(item -> {
            ShopItemVO vo = new ShopItemVO();
            vo.setId(item.getId());
            vo.setName(item.getName());
            vo.setDescription(item.getDescription());
            vo.setIcon(item.getIcon());
            vo.setPrice(item.getPrice());
            vo.setItemType(item.getItemType());
            vo.setStock(item.getStock());
            vo.setPurchased(purchasedIds.contains(item.getId()));
            return vo;
        }).toList();
    }

    @Override
    @Transactional
    public void purchaseItem(Long userId, Long itemId) {
        ShopItem item = shopItemMapper.selectById(itemId);
        if (item == null || item.getIsActive() == 0) {
            throw new RuntimeException("道具不存在或已下架");
        }
        if (item.getStock() == 0) {
            throw new RuntimeException("道具已售罄");
        }

        // 检查积分余额
        int balance = getBalance(userId);
        if (balance < item.getPrice()) {
            throw new RuntimeException("积分不足，当前积分: " + balance + "，需要: " + item.getPrice());
        }

        // 扣减库存
        if (item.getStock() > 0) {
            ShopItem update = new ShopItem();
            update.setId(itemId);
            update.setStock(item.getStock() - 1);
            shopItemMapper.updateById(update);
        }

        // 写入购买记录
        UserShopRecord record = new UserShopRecord();
        record.setUserId(userId);
        record.setItemId(itemId);
        record.setConsumedPoints(item.getPrice());
        record.setCreatedAt(LocalDateTime.now());
        shopRecordMapper.insert(record);

        // 扣减积分
        UserPoints up = new UserPoints();
        up.setUserId(userId);
        up.setPoints(-item.getPrice());
        up.setReason("购买道具: " + item.getName());
        up.setReferenceId(itemId);
        up.setCreatedAt(LocalDateTime.now());
        userPointsMapper.insert(up);

        log.info("道具购买成功: userId={}, item={}, price={}", userId, item.getName(), item.getPrice());
    }

    @Override
    public List<ShopItemVO> getMyItems(Long userId) {
        List<UserShopRecord> records = shopRecordMapper.selectList(
                new LambdaQueryWrapper<UserShopRecord>().eq(UserShopRecord::getUserId, userId));
        if (records.isEmpty()) return new ArrayList<>();

        List<Long> itemIds = records.stream().map(UserShopRecord::getItemId).distinct().toList();
        List<ShopItem> items = shopItemMapper.selectBatchIds(itemIds);

        return items.stream().map(item -> {
            ShopItemVO vo = new ShopItemVO();
            vo.setId(item.getId());
            vo.setName(item.getName());
            vo.setDescription(item.getDescription());
            vo.setIcon(item.getIcon());
            vo.setPrice(item.getPrice());
            vo.setItemType(item.getItemType());
            vo.setPurchased(true);
            return vo;
        }).toList();
    }

    private int getBalance(Long userId) {
        try {
            Long sum = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(points), 0) FROM user_points WHERE user_id = ?", Long.class, userId);
            return sum != null ? sum.intValue() : 0;
        } catch (Exception e) { return 0; }
    }
}
