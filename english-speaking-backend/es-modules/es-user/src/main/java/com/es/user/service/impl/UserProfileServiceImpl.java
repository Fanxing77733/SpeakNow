package com.es.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.user.dto.PortraitVO;
import com.es.user.entity.User;
import com.es.user.entity.UserProfile;
import com.es.user.mapper.UserMapper;
import com.es.user.mapper.UserProfileMapper;
import com.es.user.service.UserProfileService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 用户画像服务实现（V2.0）
 */
@Slf4j
@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileMapper profileMapper;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;

    public UserProfileServiceImpl(UserProfileMapper profileMapper,
                                   UserMapper userMapper,
                                   ObjectMapper objectMapper) {
        this.profileMapper = profileMapper;
        this.userMapper = userMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    public PortraitVO getPortrait(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            return new PortraitVO();
        }

        PortraitVO vo = new PortraitVO();

        // ===== 基础维度（来自 users 表）=====
        vo.setAge(user.getAge());
        vo.setGoal(user.getGoal());
        vo.setLevel(user.getLevel());
        vo.setCefrLevel(user.getCefrLevel());

        // ===== 能力/偏好/行为维度（来自 user_profile 表）=====
        UserProfile profile = profileMapper.selectOne(
                new LambdaQueryWrapper<UserProfile>()
                        .eq(UserProfile::getUserId, userId)
        );

        if (profile != null) {
            // 能力维度
            vo.setGrammarAccuracy(profile.getGrammarAccuracy());
            vo.setAvgPronunciationScore(calcAvgFromTrend(profile.getPronunciationTrend()));
            vo.setPronunciationTrend(detectTrendDirection(profile.getPronunciationTrend()));

            // 偏好维度
            vo.setPreferredTime(profile.getPreferredTime());
            vo.setPreferredScenes(extractSceneNames(profile.getPreferredScenes()));

            // 行为维度
            vo.setStreakDays(profile.getStreakDays());
            vo.setWeeklyActiveDays(profile.getWeeklyActiveDays());
            vo.setTotalPracticeCount(profile.getTotalPracticeCount());
            vo.setAvgSessionMinutes(profile.getAvgSessionMinutes());
        } else {
            // 新用户无画像，返回基础维度，其他为默认值
            vo.setStreakDays(0);
            vo.setWeeklyActiveDays(0);
            vo.setTotalPracticeCount(0);
        }

        return vo;
    }

    // ======================== 辅助方法 ========================

    /** 计算趋势均值 */
    private BigDecimal calcAvgFromTrend(String trendJson) {
        if (trendJson == null || trendJson.isBlank()) return null;
        try {
            List<Integer> scores = objectMapper.readValue(trendJson, new TypeReference<List<Integer>>() {});
            if (scores.isEmpty()) return null;
            double avg = scores.stream().mapToInt(Integer::intValue).average().orElse(0);
            return BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    /** 检测趋势方向 */
    private String detectTrendDirection(String trendJson) {
        if (trendJson == null || trendJson.isBlank()) return "无数据";
        try {
            List<Integer> scores = objectMapper.readValue(trendJson, new TypeReference<List<Integer>>() {});
            if (scores.size() < 3) return "数据不足";
            // 取最近3次与最早3次比较
            int size = scores.size();
            double recent = scores.subList(Math.max(0, size - 3), size).stream()
                    .mapToInt(Integer::intValue).average().orElse(0);
            double early = scores.subList(0, Math.min(3, size)).stream()
                    .mapToInt(Integer::intValue).average().orElse(0);
            double diff = recent - early;
            if (diff > 5) return "上升";
            if (diff < -5) return "下降";
            return "持平";
        } catch (Exception e) {
            return "无数据";
        }
    }

    /** 从场景JSON中提取场景名称列表 */
    private List<String> extractSceneNames(String scenesJson) {
        if (scenesJson == null || scenesJson.isBlank()) return new ArrayList<>();
        try {
            List<Map<String, Object>> list = objectMapper.readValue(
                    scenesJson, new TypeReference<List<Map<String, Object>>>() {});
            return list.stream()
                    .map(m -> String.valueOf(m.get("scene")))
                    .toList();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
