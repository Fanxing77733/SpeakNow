package com.es.learning.service;

import com.es.learning.dto.ProgressSummaryVO;

/**
 * 学习进度业务接口
 */
public interface ProgressService {

    /**
     * 获取当前用户的学习进度汇总
     * 从 practice_records + conversation_sessions + study_sessions 三表聚合统计
     *
     * @param userId 用户 ID
     * @return 进度汇总，无数据时 empty=true
     */
    ProgressSummaryVO getSummary(Long userId);
}
