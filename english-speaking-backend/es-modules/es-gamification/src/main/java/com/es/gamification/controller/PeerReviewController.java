package com.es.gamification.controller;

import com.es.common.dto.Result;
import com.es.gamification.dto.ReviewAssignmentVO;
import com.es.gamification.dto.ReviewStatsVO;
import com.es.gamification.dto.SubmitReviewDTO;
import com.es.gamification.service.PeerReviewService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 匿名互评控制器（V2.0 5.6）
 */
@RestController
@RequestMapping("/api/v1/reviews")
public class PeerReviewController {

    private final PeerReviewService peerReviewService;

    public PeerReviewController(PeerReviewService peerReviewService) {
        this.peerReviewService = peerReviewService;
    }

    /** 获取我的待审阅列表 */
    @GetMapping("/pending")
    public Result<List<ReviewAssignmentVO>> getMyPendingReviews() {
        return Result.ok(peerReviewService.getMyPendingReviews(getCurrentUserId()));
    }

    /** 提交评价 */
    @PostMapping("/submit")
    public Result<Void> submitReview(@Valid @RequestBody SubmitReviewDTO dto) {
        peerReviewService.submitReview(getCurrentUserId(),
            dto.getAssignmentId(), dto.getScore(), dto.getComment());
        return Result.ok();
    }

    /** 获取录音评分统计 */
    @GetMapping("/recording/{id}/stats")
    public Result<ReviewStatsVO> getRecordingStats(@PathVariable Long id) {
        return Result.ok(peerReviewService.getRecordingStats(id));
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long id)) {
            throw new RuntimeException("未登录");
        }
        return id;
    }
}
