package com.es.admin.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.es.admin.dto.ReviewItemVO;

public interface ContentReviewService {

    Page<ReviewItemVO> getReviewQueue(String status, Integer page, Integer size);

    void approveContent(Long reviewId, Long reviewerId, String ip);

    void rejectContent(Long reviewId, String comment, Long reviewerId, String ip);

    void skipContent(Long reviewId, Long reviewerId, String ip);
}
