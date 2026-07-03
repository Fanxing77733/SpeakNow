package com.es.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.es.admin.dto.ReviewItemVO;
import com.es.admin.entity.ContentReviewQueue;
import com.es.admin.entity.OperationLog;
import com.es.admin.mapper.ContentReviewMapper;
import com.es.admin.mapper.OperationLogMapper;
import com.es.admin.service.ContentReviewService;
import com.es.common.exception.BusinessException;
import com.es.user.entity.User;
import com.es.user.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
public class ContentReviewServiceImpl implements ContentReviewService {

    private final ContentReviewMapper reviewMapper;
    private final UserMapper userMapper;
    private final OperationLogMapper operationLogMapper;

    public ContentReviewServiceImpl(ContentReviewMapper reviewMapper,
                                     UserMapper userMapper,
                                     OperationLogMapper operationLogMapper) {
        this.reviewMapper = reviewMapper;
        this.userMapper = userMapper;
        this.operationLogMapper = operationLogMapper;
    }

    @Override
    public Page<ReviewItemVO> getReviewQueue(String status, Integer page, Integer size) {
        LambdaQueryWrapper<ContentReviewQueue> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(ContentReviewQueue::getStatus, status);
        }
        wrapper.orderByDesc(ContentReviewQueue::getCreatedAt);

        Page<ContentReviewQueue> resultPage = reviewMapper.selectPage(
            new Page<>(page, size), wrapper
        );

        Page<ReviewItemVO> voPage = new Page<>(resultPage.getCurrent(), resultPage.getSize(), resultPage.getTotal());
        voPage.setRecords(resultPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    @Override
    @Transactional
    public void approveContent(Long reviewId, Long reviewerId, String ip) {
        ContentReviewQueue review = findById(reviewId);
        review.setStatus("APPROVED");
        review.setReviewerId(reviewerId);
        review.setReviewedAt(LocalDateTime.now());
        reviewMapper.updateById(review);

        writeOpLog(reviewerId, "APPROVE_CONTENT", "CONTENT_REVIEW", reviewId, null, ip);
        log.info("内容审核通过: reviewId={}, reviewerId={}", reviewId, reviewerId);
    }

    @Override
    @Transactional
    public void rejectContent(Long reviewId, String comment, Long reviewerId, String ip) {
        ContentReviewQueue review = findById(reviewId);
        review.setStatus("REJECTED");
        review.setReviewerId(reviewerId);
        review.setReviewComment(comment);
        review.setReviewedAt(LocalDateTime.now());
        reviewMapper.updateById(review);

        writeOpLog(reviewerId, "REJECT_CONTENT", "CONTENT_REVIEW", reviewId, comment, ip);
        log.info("内容审核驳回: reviewId={}, reviewerId={}", reviewId, reviewerId);
    }

    @Override
    @Transactional
    public void skipContent(Long reviewId, Long reviewerId, String ip) {
        ContentReviewQueue review = findById(reviewId);
        review.setStatus("SKIPPED");
        review.setReviewerId(reviewerId);
        review.setReviewedAt(LocalDateTime.now());
        reviewMapper.updateById(review);

        log.info("内容审核跳过: reviewId={}, reviewerId={}", reviewId, reviewerId);
    }

    private ContentReviewQueue findById(Long id) {
        ContentReviewQueue review = reviewMapper.selectById(id);
        if (review == null) {
            throw new BusinessException(404, "审核记录不存在");
        }
        return review;
    }

    private void writeOpLog(Long operatorId, String action, String targetType,
                            Long targetId, String detail, String ip) {
        OperationLog logEntry = new OperationLog();
        logEntry.setOperatorId(operatorId);
        logEntry.setAction(action);
        logEntry.setTargetType(targetType);
        logEntry.setTargetId(targetId);
        logEntry.setDetail(detail);
        logEntry.setIp(ip);
        logEntry.setCreatedAt(LocalDateTime.now());
        operationLogMapper.insert(logEntry);
    }

    private ReviewItemVO toVO(ContentReviewQueue review) {
        String nickname = "";
        User user = userMapper.selectById(review.getUserId());
        if (user != null) {
            nickname = user.getNickname();
        }
        return ReviewItemVO.builder()
                .id(review.getId())
                .contentType(review.getContentType())
                .contentId(review.getContentId())
                .userId(review.getUserId())
                .userNickname(nickname)
                .contentText(review.getContentText())
                .aiScore(review.getAiScore())
                .aiTags(review.getAiTags())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
