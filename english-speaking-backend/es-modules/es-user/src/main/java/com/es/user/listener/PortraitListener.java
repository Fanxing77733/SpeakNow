package com.es.user.listener;

import com.es.common.event.PortraitEvent;
import com.es.user.entity.UserProfile;
import com.es.user.mapper.UserProfileMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 用户画像异步更新监听器（V2.0）
 * 监听业务事件，异步更新四维画像数据
 */
@Slf4j
@Component
public class PortraitListener {

    private final UserProfileMapper profileMapper;
    private final ObjectMapper objectMapper;

    private static final int TREND_WINDOW = 10;  // 统计最近10次

    public PortraitListener(UserProfileMapper profileMapper, ObjectMapper objectMapper) {
        this.profileMapper = profileMapper;
        this.objectMapper = objectMapper;
    }

    @Async
    @TransactionalEventListener
    public void onPortraitUpdate(PortraitEvent event) {
        try {
            log.info("画像更新事件: type={}, userId={}", event.getType(), event.getUserId());
            UserProfile profile = getOrCreateProfile(event.getUserId());

            switch (event.getType()) {
                case PRACTICE_COMPLETED -> handlePracticeCompleted(profile, event);
                case CONVERSATION_COMPLETED -> handleConversationCompleted(profile, event);
                case DAILY_CHECKIN -> handleDailyCheckin(profile, event);
            }

            profile.setUpdatedAt(LocalDateTime.now());
            profileMapper.updateById(profile);
            log.info("画像更新完成: userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("画像更新失败: userId={}, type={}", event.getUserId(), event.getType(), e);
        }
    }

    private void handlePracticeCompleted(UserProfile profile, PortraitEvent event) {
        // 更新发音趋势（append 最近N次得分）
        updateTrend("pronunciation", profile, event.getTotalScore());

        // 更新流利度趋势
        updateTrend("fluency", profile, event.getFluencyScore());

        // 更新总练习次数
        profile.setTotalPracticeCount(profile.getTotalPracticeCount() + 1);

        // 更新平均练习时长
        int newAvg = profile.getTotalPracticeCount() == 1
                ? event.getDurationSeconds()
                : (profile.getAvgSessionMinutes() * (profile.getTotalPracticeCount() - 1) + event.getDurationSeconds() / 60)
                    / profile.getTotalPracticeCount();
        profile.setAvgSessionMinutes(Math.max(1, newAvg));

        // 更新偏好时段
        updatePreferredTime(profile);
    }

    private void handleConversationCompleted(UserProfile profile, PortraitEvent event) {
        // 更新偏好场景（统计场景频次）
        updatePreferredScenes(profile, event.getScene());

        // 更新语法准确度
        if (event.getGrammarScore() != null) {
            BigDecimal current = profile.getGrammarAccuracy();
            if (current == null) {
                profile.setGrammarAccuracy(BigDecimal.valueOf(event.getGrammarScore()));
            } else {
                // 指数移动平均：new = 0.3 * current + 0.7 * newScore
                BigDecimal newScore = BigDecimal.valueOf(event.getGrammarScore());
                BigDecimal updated = current.multiply(BigDecimal.valueOf(0.3))
                        .add(newScore.multiply(BigDecimal.valueOf(0.7)))
                        .setScale(2, RoundingMode.HALF_UP);
                profile.setGrammarAccuracy(updated);
            }
        }
    }

    private void handleDailyCheckin(UserProfile profile, PortraitEvent event) {
        // 更新连续打卡天数（业务层负责计算并传入）——此处仅递增
        profile.setStreakDays(profile.getStreakDays() + 1);

        // 更新周活跃天数
        int current = profile.getWeeklyActiveDays() != null ? profile.getWeeklyActiveDays() : 0;
        profile.setWeeklyActiveDays(Math.min(current + 1, 7));
    }

    // ======================== 辅助方法 ========================

    private UserProfile getOrCreateProfile(Long userId) {
        UserProfile profile = profileMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<UserProfile>()
                        .eq(UserProfile::getUserId, userId)
        );
        if (profile == null) {
            profile = new UserProfile();
            profile.setUserId(userId);
            profile.setStreakDays(0);
            profile.setTotalPracticeCount(0);
            profile.setUpdatedAt(LocalDateTime.now());
            profileMapper.insert(profile);
            log.info("为 userId={} 创建画像记录", userId);
        }
        return profile;
    }

    @SuppressWarnings("unchecked")
    private void updateTrend(String type, UserProfile profile, Integer newScore) {
        if (newScore == null) return;

        List<Integer> trend;
        try {
            String currentJson = "pronunciation".equals(type)
                    ? profile.getPronunciationTrend()
                    : profile.getFluencyTrend();
            if (currentJson != null && !currentJson.isEmpty()) {
                trend = objectMapper.readValue(currentJson, List.class);
            } else {
                trend = new ArrayList<>();
            }
        } catch (JsonProcessingException e) {
            trend = new ArrayList<>();
        }

        trend.add(newScore);
        if (trend.size() > TREND_WINDOW) {
            trend = trend.subList(trend.size() - TREND_WINDOW, trend.size());
        }

        try {
            String json = objectMapper.writeValueAsString(trend);
            if ("pronunciation".equals(type)) {
                profile.setPronunciationTrend(json);
            } else {
                profile.setFluencyTrend(json);
            }
        } catch (JsonProcessingException e) {
            log.warn("趋势数据序列化失败: type={}", type, e);
        }
    }

    @SuppressWarnings("unchecked")
    private void updatePreferredScenes(UserProfile profile, String scene) {
        if (scene == null || scene.isBlank()) return;

        Map<String, Integer> countMap = new LinkedHashMap<>();
        try {
            String currentJson = profile.getPreferredScenes();
            if (currentJson != null && !currentJson.isEmpty()) {
                List<Map<String, Object>> current = objectMapper.readValue(currentJson, List.class);
                for (Map<String, Object> entry : current) {
                    String s = (String) entry.get("scene");
                    Integer c = ((Number) entry.get("count")).intValue();
                    countMap.put(s, c);
                }
            }
        } catch (JsonProcessingException e) {
            log.warn("场次数据反序列化失败", e);
        }

        countMap.merge(scene, 1, Integer::sum);

        // 按计数降序排序，取 Top 5
        List<Map<String, Object>> sorted = countMap.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("scene", entry.getKey());
                    m.put("count", entry.getValue());
                    return m;
                })
                .toList();

        try {
            profile.setPreferredScenes(objectMapper.writeValueAsString(sorted));
        } catch (JsonProcessingException e) {
            log.warn("场次数据序列化失败", e);
        }
    }

    private void updatePreferredTime(UserProfile profile) {
        int hour = LocalDateTime.now().getHour();
        String period;
        if (hour >= 6 && hour < 12) period = "morning";
        else if (hour >= 12 && hour < 18) period = "afternoon";
        else if (hour >= 18 && hour < 22) period = "evening";
        else period = "night";

        // 简单统计：如果当前画像中已有时段，保持；否则设为当前时段
        if (profile.getPreferredTime() == null || profile.getPreferredTime().isBlank()) {
            profile.setPreferredTime(period);
        }
    }
}
