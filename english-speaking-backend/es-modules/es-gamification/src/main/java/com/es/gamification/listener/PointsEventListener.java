package com.es.gamification.listener;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.event.PointsEvent;
import com.es.gamification.entity.PointRule;
import com.es.gamification.entity.UserPoints;
import com.es.gamification.mapper.PointRuleMapper;
import com.es.gamification.mapper.UserPointsMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;

/**
 * 积分事件异步监听器（V2.0）
 * 监听 PointsEvent，按 point_rules 表配置结算积分
 */
@Slf4j
@Component
public class PointsEventListener {

    private final PointRuleMapper pointRuleMapper;
    private final UserPointsMapper userPointsMapper;
    private final StringRedisTemplate redisTemplate;

    public PointsEventListener(PointRuleMapper pointRuleMapper, UserPointsMapper userPointsMapper,
                               StringRedisTemplate redisTemplate) {
        this.pointRuleMapper = pointRuleMapper;
        this.userPointsMapper = userPointsMapper;
        this.redisTemplate = redisTemplate;
    }

    @Async
    @TransactionalEventListener
    public void onPointsEvent(PointsEvent event) {
        try {
            String ruleCode = event.getType().name();
            PointRule rule = pointRuleMapper.selectOne(
                    new LambdaQueryWrapper<PointRule>()
                            .eq(PointRule::getRuleCode, ruleCode)
                            .eq(PointRule::getIsActive, 1));

            if (rule == null) {
                log.debug("未找到积分规则: {}", ruleCode);
                return;
            }

            int points = rule.getPoints();

            // 闯关通关积分动态计算
            if (event.getType() == PointsEvent.EventType.LEVEL_PASS
                    && event.getScore() != null && event.getCompletionRate() != null) {
                double completionCoeff = 0.8 + 0.4 * Math.min(event.getCompletionRate(), 1.0);
                double avgScoreCoeff = 0.8 + 0.4 * (event.getScore() / 100.0);
                points = (int) (points * completionCoeff * avgScoreCoeff);
                points = Math.max(points, rule.getPoints()); // 不低于基础分
            }

            // 写入积分记录
            UserPoints up = new UserPoints();
            up.setUserId(event.getUserId());
            up.setPoints(points);
            up.setReason(rule.getDescription());
            up.setReferenceId(event.getReferenceId());
            up.setCreatedAt(LocalDateTime.now());
            userPointsMapper.insert(up);

            // 更新 Redis 排行榜
            try {
                String key = "leaderboard:total";
                redisTemplate.opsForZSet().incrementScore(key, event.getUserId().toString(), points);
            } catch (Exception e) {
                log.warn("Redis排行榜更新失败: userId={}", event.getUserId());
            }

            log.info("积分已结算: userId={}, points={}, reason={}", event.getUserId(), points, rule.getDescription());
        } catch (Exception e) {
            log.error("积分结算失败: userId={}, type={}", event.getUserId(), event.getType(), e);
        }
    }
}
