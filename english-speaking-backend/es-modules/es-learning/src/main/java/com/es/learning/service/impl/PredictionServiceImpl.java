package com.es.learning.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.learning.entity.PredictionResult;
import com.es.learning.mapper.PredictionResultMapper;
import com.es.learning.service.PredictionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class PredictionServiceImpl implements PredictionService {

    private final JdbcTemplate jdbcTemplate;
    private final PredictionResultMapper predictionMapper;

    public PredictionServiceImpl(JdbcTemplate jdbcTemplate, PredictionResultMapper predictionMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.predictionMapper = predictionMapper;
    }

    @Override
    public Map<String, Object> getAlert(Long userId) {
        Map<String, Object> alert = new LinkedHashMap<>();

        // 1. 检查连续未学习天数
        int inactiveDays = checkInactiveDays(userId);
        if (inactiveDays >= 3) {
            alert.put("hasAlert", true);
            alert.put("alertType", "inactive");
            alert.put("alertMessage", "你已经 " + inactiveDays + " 天没练习了，今天来试试吧！");
            alert.put("predictedScore", predictScore(userId));
            alert.put("trend", "declining");
            return alert;
        }

        // 2. 检查连续下降趋势
        boolean declining = checkScoreDecline(userId);
        if (declining) {
            alert.put("hasAlert", true);
            alert.put("alertType", "decline");
            alert.put("alertMessage", "最近评测得分持续下降，建议多做音素纠错练习巩固基础");
            alert.put("predictedScore", predictScore(userId));
            alert.put("trend", "declining");
            return alert;
        }

        // 3. 正常
        double predicted = predictScore(userId);
        String trend = predicted >= 80 ? "rising" : "stable";
        alert.put("hasAlert", false);
        alert.put("alertType", "none");
        alert.put("alertMessage", predicted >= 85 ? "近期学习状态良好，继续保持！" : "稳步前进，坚持下去！");
        alert.put("predictedScore", (int) predicted);
        alert.put("trend", trend);
        return alert;
    }

    @Override
    public void computePredictions() {
        log.info("开始计算学习效果预测...");
        try {
            // 获取活跃用户
            List<Long> userIds = jdbcTemplate.queryForList(
                "SELECT DISTINCT user_id FROM practice_records WHERE created_at >= NOW() - INTERVAL 30 DAY " +
                "UNION SELECT DISTINCT user_id FROM conversation_sessions WHERE created_at >= NOW() - INTERVAL 30 DAY",
                Long.class);

            for (Long userId : userIds) {
                try {
                    double predicted = predictScore(userId);
                    // 写入未来7天预测
                    for (int i = 1; i <= 7; i++) {
                        LocalDate date = LocalDate.now().plusDays(i);
                        // 幂等：先删后插
                        jdbcTemplate.update(
                            "DELETE FROM prediction_results WHERE user_id = ? AND prediction_date = ?", userId, date);
                        PredictionResult pr = new PredictionResult();
                        pr.setUserId(userId);
                        pr.setPredictedScore(BigDecimal.valueOf(predicted));
                        pr.setPredictionDate(date);
                        pr.setGeneratedAt(LocalDateTime.now());
                        predictionMapper.insert(pr);
                    }
                } catch (Exception e) {
                    log.warn("计算用户 {} 预测失败: {}", userId, e.getMessage());
                }
            }
            log.info("学习效果预测计算完成，共处理 {} 位用户", userIds.size());
        } catch (Exception e) {
            log.error("学习效果预测计算失败", e);
        }
    }

    /** 简单线性回归预测：基于最近30天得分趋势 */
    private double predictScore(Long userId) {
        try {
            List<Map<String, Object>> scores = jdbcTemplate.queryForList(
                "SELECT total_score, DATEDIFF(NOW(), created_at) AS days_ago FROM practice_records " +
                "WHERE user_id = ? AND status = 'completed' AND total_score IS NOT NULL " +
                "AND created_at >= NOW() - INTERVAL 30 DAY ORDER BY created_at ASC", userId);

            if (scores.isEmpty()) return 75.0; // 默认预测

            // 简单线性回归: score = a * dayIndex + b
            int n = scores.size();
            double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            for (int i = 0; i < n; i++) {
                double x = i;
                double y = ((Number) scores.get(i).get("total_score")).doubleValue();
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumX2 += x * x;
            }
            double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            double intercept = (sumY - slope * sumX) / n;

            // 预测下一个值（7天后）
            double predicted = slope * (n + 7) + intercept;
            return Math.max(0, Math.min(100, Math.round(predicted * 10.0) / 10.0));
        } catch (Exception e) {
            return 75.0;
        }
    }

    /** 检查最近连续未学习天数 */
    private int checkInactiveDays(Long userId) {
        try {
            // 查找最近一次有学习记录的日期
            LocalDate lastPractice = null;
            try {
                String dateStr = jdbcTemplate.queryForObject(
                    "SELECT MAX(DATE(created_at)) FROM practice_records WHERE user_id = ?", String.class, userId);
                if (dateStr != null) lastPractice = LocalDate.parse(dateStr);
            } catch (Exception ignored) {}

            LocalDate lastConversation = null;
            try {
                String dateStr = jdbcTemplate.queryForObject(
                    "SELECT MAX(DATE(created_at)) FROM conversation_sessions WHERE user_id = ?", String.class, userId);
                if (dateStr != null) lastConversation = LocalDate.parse(dateStr);
            } catch (Exception ignored) {}

            LocalDate lastActive = lastPractice;
            if (lastConversation != null && (lastActive == null || lastConversation.isAfter(lastActive))) {
                lastActive = lastConversation;
            }
            if (lastActive == null) return 0;

            return (int) java.time.temporal.ChronoUnit.DAYS.between(lastActive, LocalDate.now());
        } catch (Exception e) { return 0; }
    }

    /** 检查最近5次得分是否连续下降 */
    private boolean checkScoreDecline(Long userId) {
        try {
            List<BigDecimal> scores = jdbcTemplate.queryForList(
                "SELECT total_score FROM practice_records WHERE user_id = ? AND status = 'completed' " +
                "AND total_score IS NOT NULL ORDER BY created_at DESC LIMIT 5",
                BigDecimal.class, userId);
            if (scores.size() < 5) return false;

            for (int i = 1; i < scores.size(); i++) {
                if (scores.get(i).compareTo(scores.get(i - 1)) <= 0) return false;
            }
            return true; // 连续下降 (因为DESC排序，scores[0]最新)
        } catch (Exception e) { return false; }
    }
}
