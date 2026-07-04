package com.es.gamification.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.event.PointsEvent;
import com.es.gamification.dto.ReviewAssignmentVO;
import com.es.gamification.dto.ReviewStatsVO;
import com.es.gamification.entity.PeerReview;
import com.es.gamification.entity.ReviewAssignment;
import com.es.gamification.mapper.PeerReviewMapper;
import com.es.gamification.mapper.ReviewAssignmentMapper;
import com.es.gamification.service.PeerReviewService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 匿名互评服务实现（V2.0 5.6）
 */
@Slf4j
@Service
public class PeerReviewServiceImpl implements PeerReviewService {

    private final ReviewAssignmentMapper assignmentMapper;
    private final PeerReviewMapper peerReviewMapper;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;

    public PeerReviewServiceImpl(ReviewAssignmentMapper assignmentMapper,
                                  PeerReviewMapper peerReviewMapper,
                                  JdbcTemplate jdbcTemplate,
                                  ApplicationEventPublisher eventPublisher) {
        this.assignmentMapper = assignmentMapper;
        this.peerReviewMapper = peerReviewMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public void assignReviewers(Long recordingId, Long ownerUserId) {
        // 1. 查询该录音的 content_id
        Integer contentId = null;
        try {
            contentId = jdbcTemplate.queryForObject(
                "SELECT content_id FROM practice_records WHERE id = ?",
                Integer.class, recordingId);
        } catch (Exception e) {
            log.warn("录音不存在: recordingId={}", recordingId);
            return;
        }
        if (contentId == null) return;

        // 2. 查询最近7天内有完成记录的用户（排除录音owner）
        List<Long> candidateUsers = jdbcTemplate.queryForList(
            "SELECT DISTINCT user_id FROM practice_records " +
            "WHERE status = 'completed' AND created_at >= ? AND user_id != ?",
            Long.class,
            LocalDateTime.now().minusDays(7),
            ownerUserId);

        if (candidateUsers.isEmpty()) {
            log.info("无可选评价者: recordingId={}", recordingId);
            return;
        }

        // 3. 排除已有该录音 pending assignment 的用户
        Set<Long> alreadyAssigned = new HashSet<>();
        List<ReviewAssignment> existingAssignments = assignmentMapper.selectList(
            new LambdaQueryWrapper<ReviewAssignment>()
                .eq(ReviewAssignment::getRecordingId, recordingId)
                .eq(ReviewAssignment::getStatus, "pending"));
        for (ReviewAssignment a : existingAssignments) {
            alreadyAssigned.add(a.getReviewerId());
        }

        // 4. 排除 pending 分配数 >5 的用户（防止积压）
        List<Long> overburdenedUsers = new ArrayList<>();
        for (Long uid : candidateUsers) {
            Long pendingCount = assignmentMapper.selectCount(
                new LambdaQueryWrapper<ReviewAssignment>()
                    .eq(ReviewAssignment::getReviewerId, uid)
                    .eq(ReviewAssignment::getStatus, "pending"));
            if (pendingCount != null && pendingCount >= 5) {
                overburdenedUsers.add(uid);
            }
        }

        // 5. 筛选合格候选人
        List<Long> eligible = new ArrayList<>();
        for (Long uid : candidateUsers) {
            if (!alreadyAssigned.contains(uid) && !overburdenedUsers.contains(uid)) {
                eligible.add(uid);
            }
        }

        // 6. 随机选最多3人
        Collections.shuffle(eligible);
        int assignCount = Math.min(3, eligible.size());
        if (assignCount == 0) {
            log.info("无合格评价者可分配: recordingId={}", recordingId);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < assignCount; i++) {
            ReviewAssignment assignment = new ReviewAssignment();
            assignment.setRecordingId(recordingId);
            assignment.setReviewerId(eligible.get(i));
            assignment.setStatus("pending");
            assignment.setAssignedAt(now);
            assignmentMapper.insert(assignment);
        }

        log.info("已分配评价者: recordingId={}, count={}", recordingId, assignCount);
    }

    @Override
    public List<ReviewAssignmentVO> getMyPendingReviews(Long userId) {
        List<ReviewAssignment> assignments = assignmentMapper.selectList(
            new LambdaQueryWrapper<ReviewAssignment>()
                .eq(ReviewAssignment::getReviewerId, userId)
                .eq(ReviewAssignment::getStatus, "pending")
                .orderByDesc(ReviewAssignment::getAssignedAt));

        List<ReviewAssignmentVO> result = new ArrayList<>();
        for (ReviewAssignment a : assignments) {
            ReviewAssignmentVO vo = new ReviewAssignmentVO();
            vo.setId(a.getId());
            vo.setRecordingId(a.getRecordingId());
            vo.setStatus(a.getStatus());
            vo.setAssignedAt(a.getAssignedAt() != null
                ? a.getAssignedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);

            // 查询录音内容摘要和owner昵称
            try {
                Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT cs.sentence, COALESCE(u.nickname, u.email) AS user_name FROM practice_records pr " +
                    "LEFT JOIN content_sentences cs ON pr.content_id = cs.id " +
                    "LEFT JOIN users u ON pr.user_id = u.id " +
                    "WHERE pr.id = ?", a.getRecordingId());
                vo.setSentencePreview(row.get("sentence") != null
                    ? truncate(String.valueOf(row.get("sentence")), 50) : "");
                vo.setUserName(row.get("user_name") != null
                    ? String.valueOf(row.get("user_name")) : "匿名");
            } catch (Exception e) {
                vo.setSentencePreview("");
                vo.setUserName("匿名");
            }

            result.add(vo);
        }
        return result;
    }

    @Override
    @Transactional
    public void submitReview(Long reviewerId, Long assignmentId, int score, String comment) {
        // 1. 验证 assignment 存在且属于当前用户，且 status='pending'
        ReviewAssignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new RuntimeException("该评价任务不存在");
        }
        if (!assignment.getReviewerId().equals(reviewerId)) {
            throw new RuntimeException("您无权提交此评价");
        }
        if (!"pending".equals(assignment.getStatus())) {
            throw new RuntimeException("该评价任务已处理");
        }

        // 2. 校验评分范围
        if (score < 1 || score > 100) {
            throw new RuntimeException("评分范围 1-100");
        }
        // 3. 校验评论长度
        if (comment != null && comment.length() > 500) {
            throw new RuntimeException("评论不超过500字符");
        }

        Long recordingId = assignment.getRecordingId();

        // 4. 查询该录音的 AI 评分
        Double aiScore = null;
        try {
            aiScore = jdbcTemplate.queryForObject(
                "SELECT total_score FROM practice_records WHERE id = ?",
                Double.class, recordingId);
        } catch (Exception e) {
            log.warn("查询AI评分失败: recordingId={}", recordingId);
        }

        // 5. 计算偏差
        BigDecimal deviationPct = null;
        int isSuspicious = 0;
        if (aiScore != null && aiScore > 0) {
            double diff = Math.abs(score - aiScore);
            double pct = (diff / aiScore) * 100.0;
            deviationPct = BigDecimal.valueOf(pct).setScale(2, RoundingMode.HALF_UP);
            if (pct > 40.0) {
                isSuspicious = 1;
            }
        }

        // 6. 写入 peer_reviews 表
        PeerReview review = new PeerReview();
        review.setAssignmentId(assignmentId);
        review.setRecordingId(recordingId);
        review.setReviewerId(reviewerId);
        review.setScore(score);
        review.setComment(comment);
        review.setIsSuspicious(isSuspicious);
        review.setDeviationPct(deviationPct);
        review.setCreatedAt(LocalDateTime.now());
        peerReviewMapper.insert(review);

        // 7. 更新 assignment 状态
        assignment.setStatus("completed");
        assignment.setCompletedAt(LocalDateTime.now());
        assignmentMapper.updateById(assignment);

        // 8. 发布积分事件（只有非可疑评价才给积分）
        if (isSuspicious == 0) {
            eventPublisher.publishEvent(
                PointsEvent.peerReview(reviewerId).withReferenceId(review.getId()));
        }

        log.info("互评提交完成: assignmentId={}, reviewerId={}, score={}, suspicious={}",
            assignmentId, reviewerId, score, isSuspicious);
    }

    @Override
    public ReviewStatsVO getRecordingStats(Long recordingId) {
        ReviewStatsVO vo = new ReviewStatsVO();
        vo.setRecordingId(recordingId);

        // 1. 统计有效（非可疑）评价：数量和平均分
        List<Map<String, Object>> stats = jdbcTemplate.queryForList(
            "SELECT COUNT(*) AS cnt, COALESCE(AVG(score), 0) AS avg_score " +
            "FROM peer_reviews WHERE recording_id = ? AND is_suspicious = 0",
            recordingId);
        if (!stats.isEmpty()) {
            Object cntObj = stats.get(0).get("cnt");
            Object avgObj = stats.get(0).get("avg_score");
            vo.setReviewCount(cntObj != null ? ((Number) cntObj).intValue() : 0);
            vo.setAvgScore(avgObj != null ? ((Number) avgObj).doubleValue() : 0.0);
        }

        // 2. 查询 AI 评分
        try {
            Double aiScore = jdbcTemplate.queryForObject(
                "SELECT total_score FROM practice_records WHERE id = ?",
                Double.class, recordingId);
            vo.setAiScore(aiScore != null ? aiScore : 0.0);

            // 3. 交叉验证：有效评价 >= 3 且平均偏差 <= 20 分，则 verified=true
            if (vo.getReviewCount() >= 3 && aiScore != null && aiScore > 0) {
                double diff = Math.abs(vo.getAvgScore() - aiScore);
                vo.setVerified(diff <= 20.0);
            }
        } catch (Exception e) {
            vo.setAiScore(0.0);
            vo.setVerified(false);
        }

        return vo;
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }
}
