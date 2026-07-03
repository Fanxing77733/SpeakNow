package com.es.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.admin.entity.ContentReviewQueue;
import com.es.admin.mapper.ContentReviewMapper;
import com.es.admin.service.DashboardService;
import com.es.user.entity.User;
import com.es.user.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class DashboardServiceImpl implements DashboardService {

    private final UserMapper userMapper;
    private final ContentReviewMapper reviewMapper;
    private final JdbcTemplate jdbcTemplate;

    public DashboardServiceImpl(UserMapper userMapper,
                                 ContentReviewMapper reviewMapper,
                                 JdbcTemplate jdbcTemplate) {
        this.userMapper = userMapper;
        this.reviewMapper = reviewMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Map<String, Object> getOverview() {
        Map<String, Object> data = new HashMap<>();

        // 总注册用户数
        Long totalUsers = userMapper.selectCount(null);
        data.put("totalUsers", totalUsers);

        // 今日新增用户
        String today = LocalDate.now().toString();
        LambdaQueryWrapper<User> todayWrapper = new LambdaQueryWrapper<>();
        todayWrapper.apply("DATE(created_at) = '" + today + "'");
        Long todayNewUsers = userMapper.selectCount(todayWrapper);
        data.put("todayNewUsers", todayNewUsers);

        // 今日活跃用户 (有 study_sessions 记录的)
        try {
            Long dau = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT user_id) FROM study_sessions WHERE DATE(created_at) = ?",
                Long.class, today
            );
            data.put("dau", dau != null ? dau : 0);
        } catch (Exception e) {
            data.put("dau", 0);
        }

        // 本月活跃用户
        try {
            String monthStart = today.substring(0, 7) + "-01";
            Long mau = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT user_id) FROM study_sessions WHERE DATE(created_at) >= ?",
                Long.class, monthStart
            );
            data.put("mau", mau != null ? mau : 0);
        } catch (Exception e) {
            data.put("mau", 0);
        }

        // 待审核内容数
        LambdaQueryWrapper<ContentReviewQueue> pendingWrapper = new LambdaQueryWrapper<>();
        pendingWrapper.eq(ContentReviewQueue::getStatus, "PENDING");
        Long pendingReviews = reviewMapper.selectCount(pendingWrapper);
        data.put("pendingReviews", pendingReviews);

        // 今日审核完成数
        try {
            Long todayReviewed = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM content_review_queue WHERE DATE(reviewed_at) = ?",
                Long.class, today
            );
            data.put("todayReviewed", todayReviewed != null ? todayReviewed : 0);
        } catch (Exception e) {
            data.put("todayReviewed", 0);
        }

        return data;
    }

    @Override
    public Map<String, Object> getUserStats() {
        Map<String, Object> data = new HashMap<>();

        // 总练习记录数
        try {
            Long totalPractices = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM practice_records", Long.class
            );
            data.put("totalPractices", totalPractices != null ? totalPractices : 0);
        } catch (Exception e) {
            data.put("totalPractices", 0);
        }

        // 总对话次数
        try {
            Long totalConversations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM conversation_sessions WHERE status = 'completed'", Long.class
            );
            data.put("totalConversations", totalConversations != null ? totalConversations : 0);
        } catch (Exception e) {
            data.put("totalConversations", 0);
        }

        // 用户角色分布
        try {
            var roleRows = jdbcTemplate.queryForList(
                "SELECT role, COUNT(*) AS cnt FROM users GROUP BY role"
            );
            Map<String, Long> roleDistribution = new HashMap<>();
            for (var row : roleRows) {
                roleDistribution.put(
                    String.valueOf(row.get("role")),
                    ((Number) row.get("cnt")).longValue()
                );
            }
            data.put("roleDistribution", roleDistribution);
        } catch (Exception e) {
            data.put("roleDistribution", Map.of());
        }

        return data;
    }
}
