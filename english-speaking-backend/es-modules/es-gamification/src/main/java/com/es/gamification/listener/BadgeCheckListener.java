package com.es.gamification.listener;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.event.BadgeCheckEvent;
import com.es.gamification.entity.BadgeRule;
import com.es.gamification.entity.UserBadge;
import com.es.gamification.entity.UserPoints;
import com.es.gamification.mapper.BadgeRuleMapper;
import com.es.gamification.mapper.UserBadgeMapper;
import com.es.gamification.mapper.UserPointsMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 勋章检测异步监听器（V2.0）
 * 监听 BadgeCheckEvent，按 badge_rules 表配置检测并发放勋章
 */
@Slf4j
@Component
public class BadgeCheckListener {

    private final BadgeRuleMapper badgeRuleMapper;
    private final UserBadgeMapper userBadgeMapper;
    private final UserPointsMapper userPointsMapper;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public BadgeCheckListener(BadgeRuleMapper badgeRuleMapper, UserBadgeMapper userBadgeMapper,
                              UserPointsMapper userPointsMapper, JdbcTemplate jdbcTemplate,
                              ObjectMapper objectMapper) {
        this.badgeRuleMapper = badgeRuleMapper;
        this.userBadgeMapper = userBadgeMapper;
        this.userPointsMapper = userPointsMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Async
    @TransactionalEventListener
    public void onBadgeCheck(BadgeCheckEvent event) {
        try {
            Long userId = event.getUserId();
            List<UserBadge> existing = userBadgeMapper.selectList(
                    new LambdaQueryWrapper<UserBadge>().eq(UserBadge::getUserId, userId));
            List<String> earnedTypes = existing.stream().map(UserBadge::getBadgeType).toList();

            List<BadgeRule> rules = badgeRuleMapper.selectList(
                    new LambdaQueryWrapper<BadgeRule>().eq(BadgeRule::getIsActive, 1));

            for (BadgeRule rule : rules) {
                if (earnedTypes.contains(rule.getBadgeType())) continue;
                if (checkCondition(userId, rule)) {
                    awardBadge(userId, rule);
                }
            }
        } catch (Exception e) {
            log.error("勋章检测失败: userId={}", event.getUserId(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private boolean checkCondition(Long userId, BadgeRule rule) {
        try {
            Map<String, Object> cond = objectMapper.readValue(rule.getConditionJson(), Map.class);
            String metric = (String) cond.get("metric");
            String operator = (String) cond.get("operator");
            double value = ((Number) cond.get("value")).doubleValue();

            double actual = getMetricValue(userId, metric);

            if (cond.containsKey("extraMetric")) {
                String extraMetric = (String) cond.get("extraMetric");
                String extraOperator = (String) cond.get("extraOperator");
                double extraValue = ((Number) cond.get("extraValue")).doubleValue();
                double extraActual = getMetricValue(userId, extraMetric);
                if (!compare(extraActual, extraOperator, extraValue)) return false;
            }

            return compare(actual, operator, value);
        } catch (Exception e) {
            log.warn("勋章条件解析失败: badgeType={}", rule.getBadgeType(), e);
            return false;
        }
    }

    private double getMetricValue(Long userId, String metric) {
        return switch (metric) {
            case "practice_count" -> countTable(userId, "practice_records", "status = 'completed'");
            case "conversation_count" -> countTable(userId, "conversation_sessions", "status = 'completed'");
            case "assessment_count" -> countTable(userId, "assessment_records", null);
            case "pk_count" -> countTable(userId, "pk_matches",
                    "(player1_id = " + userId + " OR player2_id = " + userId + ") AND status = 'completed'");
            case "streak_days" -> countDistinctStreak(userId);
            case "level_cleared" -> countTable(userId, "user_level_progress", "status = 'completed'");
            case "peer_review_count" -> countTable(userId, "peer_reviews", "is_suspicious = 0");
            case "practice_avg_score" -> {
                try {
                    Double avg = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(AVG(total_score), 0) FROM practice_records WHERE user_id = ? AND status = 'completed'",
                        Double.class, userId);
                    yield avg != null ? avg : 0;
                } catch (Exception e) { yield 0; }
            }
            default -> 0;
        };
    }

    private double countTable(Long userId, String table, String extraCond) {
        try {
            String sql = "SELECT COUNT(*) FROM " + table + " WHERE user_id = ?";
            if (extraCond != null && !extraCond.isBlank()) {
                sql += " AND " + extraCond;
            }
            Long cnt = jdbcTemplate.queryForObject(sql, Long.class, userId);
            return cnt != null ? cnt.doubleValue() : 0;
        } catch (Exception e) { return 0; }
    }

    private double countDistinctStreak(Long userId) {
        try {
            Long cnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT checkin_date) FROM daily_checkins WHERE user_id = ? " +
                "AND checkin_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)", Long.class, userId);
            return cnt != null ? cnt.doubleValue() : 0;
        } catch (Exception e) { return 0; }
    }

    private boolean compare(double actual, String operator, double target) {
        return switch (operator) {
            case ">=" -> actual >= target;
            case ">" -> actual > target;
            case "<=" -> actual <= target;
            case "<" -> actual < target;
            case "==" -> Math.abs(actual - target) < 0.01;
            default -> false;
        };
    }

    private void awardBadge(Long userId, BadgeRule rule) {
        UserBadge badge = new UserBadge();
        badge.setUserId(userId);
        badge.setBadgeType(rule.getBadgeType());
        badge.setBadgeName(rule.getBadgeName());
        badge.setEarnedAt(LocalDateTime.now());
        userBadgeMapper.insert(badge);
        log.info("勋章已颁发: userId={}, badge={}", userId, rule.getBadgeName());

        // 获得勋章直接奖励积分
        UserPoints up = new UserPoints();
        up.setUserId(userId);
        up.setPoints(10);
        up.setReason("获得勋章: " + rule.getBadgeName());
        up.setReferenceId(badge.getId());
        up.setCreatedAt(LocalDateTime.now());
        userPointsMapper.insert(up);
    }
}
