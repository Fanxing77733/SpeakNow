package com.es.gamification.scheduler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.gamification.entity.ReviewAssignment;
import com.es.gamification.mapper.ReviewAssignmentMapper;
import com.es.gamification.service.PeerReviewService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 互评过期检查定时任务（每5分钟）
 * 将超过24小时仍未完成的分配标记为 expired，并为对应录音重新分配评价者
 */
@Slf4j
@Component
public class ReviewExpiryTask {

    private final ReviewAssignmentMapper assignmentMapper;
    private final PeerReviewService peerReviewService;
    private final JdbcTemplate jdbcTemplate;

    public ReviewExpiryTask(ReviewAssignmentMapper assignmentMapper,
                            PeerReviewService peerReviewService,
                            JdbcTemplate jdbcTemplate) {
        this.assignmentMapper = assignmentMapper;
        this.peerReviewService = peerReviewService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Scheduled(fixedRate = 300000)  // 每5分钟执行一次
    public void expirePendingReviews() {
        log.debug("[定时任务] 检查过期互评分配");

        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        // 查询超过24小时仍未完成的 pending 分配
        List<ReviewAssignment> expired = assignmentMapper.selectList(
            new LambdaQueryWrapper<ReviewAssignment>()
                .eq(ReviewAssignment::getStatus, "pending")
                .lt(ReviewAssignment::getAssignedAt, cutoff));

        if (expired.isEmpty()) return;

        for (ReviewAssignment assignment : expired) {
            // 标记为 expired
            assignment.setStatus("expired");
            assignmentMapper.updateById(assignment);

            // 查询录音 owner，用于重新分配
            Long recordingId = assignment.getRecordingId();
            Long ownerUserId = null;
            try {
                ownerUserId = jdbcTemplate.queryForObject(
                    "SELECT user_id FROM practice_records WHERE id = ?",
                    Long.class, recordingId);
            } catch (Exception e) {
                log.warn("查询录音owner失败: recordingId={}", recordingId);
            }

            // 重新分配评价者（排除原有分配者，由 assignReviewers 内部自动过滤）
            if (ownerUserId != null) {
                peerReviewService.assignReviewers(recordingId, ownerUserId);
            }
        }

        log.info("[定时任务] 已过期 {} 条互评分配并重新分配", expired.size());
    }
}
