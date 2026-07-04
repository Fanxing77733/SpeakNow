package com.es.gamification.service;

import com.es.gamification.dto.ReviewAssignmentVO;
import com.es.gamification.dto.ReviewStatsVO;

import java.util.List;

/**
 * 匿名互评服务接口（V2.0 5.6）
 */
public interface PeerReviewService {

    /** 为一条录音分配3位评价者 */
    void assignReviewers(Long recordingId, Long ownerUserId);

    /** 获取我的待审阅列表 */
    List<ReviewAssignmentVO> getMyPendingReviews(Long userId);

    /** 提交评价 */
    void submitReview(Long reviewerId, Long assignmentId, int score, String comment);

    /** 获取录音评分统计 */
    ReviewStatsVO getRecordingStats(Long recordingId);
}
