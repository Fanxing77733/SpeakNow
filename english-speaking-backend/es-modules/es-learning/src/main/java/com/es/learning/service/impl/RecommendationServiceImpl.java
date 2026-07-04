package com.es.learning.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.learning.entity.RecommendationCache;
import com.es.learning.mapper.RecommendationCacheMapper;
import com.es.learning.service.RecommendationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class RecommendationServiceImpl implements RecommendationService {

    private final JdbcTemplate jdbcTemplate;
    private final RecommendationCacheMapper cacheMapper;

    public RecommendationServiceImpl(JdbcTemplate jdbcTemplate, RecommendationCacheMapper cacheMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.cacheMapper = cacheMapper;
    }

    @Override
    public List<Map<String, Object>> recommendSentences(Long userId) {
        // 优先从缓存读取
        List<RecommendationCache> cached = cacheMapper.selectList(
            new LambdaQueryWrapper<RecommendationCache>()
                .eq(RecommendationCache::getUserId, userId)
                .eq(RecommendationCache::getContentType, "sentence")
                .orderByDesc(RecommendationCache::getScore)
                .last("LIMIT 6"));
        if (!cached.isEmpty()) {
            return cached.stream().map(c -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", c.getContentId());
                m.put("reason", c.getReason());
                // 从 content_sentences 读取句子文本
                try {
                    String sentence = jdbcTemplate.queryForObject(
                        "SELECT sentence FROM content_sentences WHERE id = ?", String.class, c.getContentId());
                    m.put("sentence", sentence != null ? sentence : "");
                } catch (Exception e) { m.put("sentence", ""); }
                m.put("level", "intermediate");
                return m;
            }).toList();
        }
        // 缓存空：实时查询
        return realtimeRecommendSentences(userId);
    }

    @Override
    public List<Map<String, String>> recommendScenes(Long userId) {
        // 基于用户级别推荐场景
        String userLevel = getUserLevel(userId);
        List<Map<String, String>> scenes = new ArrayList<>();

        if ("beginner".equals(userLevel)) {
            scenes.add(Map.of("scene", "self_intro", "label", "自我介绍", "reason", "适合初学者练习"));
            scenes.add(Map.of("scene", "daily_greeting", "label", "日常问候", "reason", "基础对话练习"));
            scenes.add(Map.of("scene", "restaurant", "label", "餐厅点餐", "reason", "入门实用场景"));
        } else if ("advanced".equals(userLevel)) {
            scenes.add(Map.of("scene", "business_meeting", "label", "商务会议", "reason", "适合你的高级水平"));
            scenes.add(Map.of("scene", "job_interview", "label", "工作面试", "reason", "职场进阶练习"));
            scenes.add(Map.of("scene", "debate", "label", "英语辩论", "reason", "高阶表达训练"));
        } else {
            scenes.add(Map.of("scene", "campus_life", "label", "校园生活", "reason", "经典对话场景"));
            scenes.add(Map.of("scene", "travel_hotel", "label", "酒店入住", "reason", "旅行实用场景"));
            scenes.add(Map.of("scene", "shop_clothing", "label", "服装购物", "reason", "日常高频场景"));
        }
        return scenes;
    }

    @Override
    public void computeAndCacheRecommendations() {
        log.info("开始离线计算推荐缓存...");
        try {
            // 获取活跃用户列表
            List<Long> userIds = jdbcTemplate.queryForList(
                "SELECT DISTINCT user_id FROM practice_records WHERE status = 'completed' " +
                "UNION SELECT DISTINCT user_id FROM conversation_sessions WHERE status = 'completed'",
                Long.class);
            if (userIds.isEmpty()) {
                log.info("无活跃用户，跳过推荐计算");
                return;
            }

            // 清空旧缓存
            jdbcTemplate.update("DELETE FROM recommendation_cache WHERE generated_at < NOW() - INTERVAL 1 DAY");

            for (Long userId : userIds) {
                try {
                    String userLevel = getUserLevel(userId);
                    // 推荐未练习过的句子
                    List<Map<String, Object>> recs = jdbcTemplate.queryForList(
                        "SELECT cs.id, cs.sentence, cs.difficulty FROM content_sentences cs " +
                        "WHERE cs.id NOT IN (SELECT DISTINCT content_id FROM practice_records WHERE user_id = ?) " +
                        "ORDER BY CASE WHEN cs.difficulty = ? THEN 0 ELSE 1 END, RAND() LIMIT 6",
                        userId, userLevel);
                    for (Map<String, Object> rec : recs) {
                        RecommendationCache cache = new RecommendationCache();
                        cache.setUserId(userId);
                        cache.setContentType("sentence");
                        cache.setContentId(((Number) rec.get("id")).intValue());
                        cache.setScore(BigDecimal.valueOf(Math.random() * 0.3 + 0.7));
                        cache.setReason("适合你的级别练习");
                        cache.setGeneratedAt(LocalDateTime.now());
                        cacheMapper.insert(cache);
                    }
                } catch (Exception e) {
                    log.warn("计算用户 {} 推荐失败: {}", userId, e.getMessage());
                }
            }
            log.info("推荐缓存计算完成，共处理 {} 位用户", userIds.size());
        } catch (Exception e) {
            log.error("推荐缓存计算失败", e);
        }
    }

    private List<Map<String, Object>> realtimeRecommendSentences(Long userId) {
        String userLevel = getUserLevel(userId);
        List<Map<String, Object>> list;
        try {
            list = jdbcTemplate.queryForList(
                "SELECT id, sentence, difficulty FROM content_sentences " +
                "WHERE id NOT IN (SELECT DISTINCT content_id FROM practice_records WHERE user_id = ?) " +
                "ORDER BY CASE WHEN difficulty = ? THEN 0 ELSE 1 END, RAND() LIMIT 6",
                userId, userLevel);
        } catch (Exception e) {
            list = jdbcTemplate.queryForList(
                "SELECT id, sentence, difficulty FROM content_sentences ORDER BY RAND() LIMIT 6");
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", row.get("id"));
            m.put("sentence", row.get("sentence"));
            m.put("level", row.getOrDefault("difficulty", "intermediate"));
            m.put("reason", "为你精选的练习内容");
            result.add(m);
        }
        return result.isEmpty() ? List.of(
            Map.of("id", 1, "sentence", "The quick brown fox jumps over the lazy dog.", "level", "intermediate", "reason", "发音练习推荐"),
            Map.of("id", 2, "sentence", "I've been studying English for three years now.", "level", "beginner", "reason", "适合你的级别"),
            Map.of("id", 3, "sentence", "Could you please tell me how to get to the nearest subway station?", "level", "intermediate", "reason", "旅行场景练习")
        ) : result;
    }

    private String getUserLevel(Long userId) {
        try {
            String level = jdbcTemplate.queryForObject(
                "SELECT COALESCE(cefr_level, CASE WHEN level = 'advanced' THEN 'advanced' WHEN level = 'intermediate' THEN 'intermediate' ELSE 'beginner' END) FROM users WHERE id = ?",
                String.class, userId);
            return level != null ? level : "beginner";
        } catch (Exception e) { return "beginner"; }
    }
}
