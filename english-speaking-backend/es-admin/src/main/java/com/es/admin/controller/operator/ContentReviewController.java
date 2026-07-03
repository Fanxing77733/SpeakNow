package com.es.admin.controller.operator;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.es.admin.dto.ReviewDecisionDTO;
import com.es.admin.dto.ReviewItemVO;
import com.es.admin.service.ContentReviewService;
import com.es.common.dto.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/operator")
public class ContentReviewController {

    private final ContentReviewService reviewService;

    public ContentReviewController(ContentReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /** 审核队列 */
    @GetMapping("/reviews")
    public Result<Page<ReviewItemVO>> getReviews(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        Long reviewerId = getCurrentUserId();
        log.info("查看审核队列: reviewerId={}, status={}", reviewerId, status);
        return Result.ok(reviewService.getReviewQueue(status, page, size));
    }

    /** 审核操作 */
    @PostMapping("/reviews/{id}/decision")
    public Result<Void> review(@PathVariable Long id,
                                @Valid @RequestBody ReviewDecisionDTO dto,
                                HttpServletRequest request) {
        Long reviewerId = getCurrentUserId();
        String ip = getClientIp(request);
        log.info("审核操作: reviewerId={}, reviewId={}, action={}", reviewerId, id, dto.getAction());
        switch (dto.getAction().toUpperCase()) {
            case "APPROVE":
                reviewService.approveContent(id, reviewerId, ip);
                break;
            case "REJECT":
                reviewService.rejectContent(id, dto.getComment(), reviewerId, ip);
                break;
            case "SKIP":
                reviewService.skipContent(id, reviewerId, ip);
                break;
            default:
                throw new IllegalArgumentException("无效的审核操作: " + dto.getAction());
        }
        return Result.ok(null);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) return xff.split(",")[0].trim();
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isEmpty()) return xri;
        return request.getRemoteAddr();
    }
}
