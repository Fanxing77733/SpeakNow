package com.es.learning.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.es.learning.dto.ProgressSummaryVO;
import com.es.learning.dto.ProgressSummaryVO.SummaryDetail;
import com.es.learning.entity.StudySession;
import com.es.learning.mapper.StudySessionMapper;
import com.es.learning.service.ProgressService;
import com.es.practice.entity.ConversationSession;
import com.es.practice.entity.PracticeRecord;
import com.es.practice.mapper.ConversationSessionMapper;
import com.es.practice.mapper.PracticeRecordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 学习进度业务实现 — 从三表聚合统计数据
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressServiceImpl implements ProgressService {

    private final PracticeRecordMapper practiceRecordMapper;
    private final ConversationSessionMapper conversationSessionMapper;
    private final StudySessionMapper studySessionMapper;

    @Override
    public ProgressSummaryVO getSummary(Long userId) {
        log.info("查询学习进度汇总: userId={}", userId);

        // 1. 总练习次数 = COUNT(completed practice) + COUNT(completed conversation)
        long practiceCount = practiceRecordMapper.selectCount(
                new LambdaQueryWrapper<PracticeRecord>()
                        .eq(PracticeRecord::getUserId, userId)
                        .eq(PracticeRecord::getStatus, "completed"));

        long conversationCount = conversationSessionMapper.selectCount(
                new LambdaQueryWrapper<ConversationSession>()
                        .eq(ConversationSession::getUserId, userId)
                        .eq(ConversationSession::getStatus, "completed"));

        int totalPractices = (int) practiceCount + (int) conversationCount;

        // 如果完全没有已完成数据 → 返回空状态
        if (totalPractices == 0) {
            log.info("用户 {} 无学习记录，返回空状态", userId);
            ProgressSummaryVO vo = new ProgressSummaryVO();
            vo.setEmpty(true);
            vo.setSummary(null);
            return vo;
        }

        // 2. 总学习时长 = SUM 三张表的 duration_seconds（不限制 status，所有学习时间都算）
        int practiceDuration = aggregateInt(practiceRecordMapper,
                new QueryWrapper<PracticeRecord>()
                        .select("IFNULL(SUM(duration_seconds), 0) as val")
                        .eq("user_id", userId));

        int conversationDuration = aggregateInt(conversationSessionMapper,
                new QueryWrapper<ConversationSession>()
                        .select("IFNULL(SUM(total_duration_seconds), 0) as val")
                        .eq("user_id", userId));

        int studyDuration = aggregateInt(studySessionMapper,
                new QueryWrapper<StudySession>()
                        .select("IFNULL(SUM(duration_seconds), 0) as val")
                        .eq("user_id", userId));

        int totalDurationSeconds = practiceDuration + conversationDuration + studyDuration;

        // 3. 历史最高分 = MAX(practice_records.total_score WHERE status='completed')
        BigDecimal highestScore = aggregateDecimal(practiceRecordMapper,
                new QueryWrapper<PracticeRecord>()
                        .select("IFNULL(MAX(total_score), 0) as val")
                        .eq("user_id", userId)
                        .eq("status", "completed"));

        // 构造响应
        SummaryDetail detail = new SummaryDetail();
        detail.setTotalPractices(totalPractices);
        detail.setTotalDurationSeconds(totalDurationSeconds);
        detail.setHighestScore(highestScore);
        detail.setTotalDurationFormatted(formatDuration(totalDurationSeconds));

        ProgressSummaryVO vo = new ProgressSummaryVO();
        vo.setEmpty(false);
        vo.setSummary(detail);
        log.info("学习进度汇总完成: userId={}, totalPractices={}, totalDuration={}s, highestScore={}",
                userId, totalPractices, totalDurationSeconds, highestScore);
        return vo;
    }

    /**
     * 执行 SUM 聚合查询，返回 int 结果
     */
    private static <T> int aggregateInt(BaseMapper<T> mapper, QueryWrapper<T> wrapper) {
        List<Map<String, Object>> maps = mapper.selectMaps(wrapper);
        if (maps == null || maps.isEmpty()) {
            return 0;
        }
        Number val = (Number) maps.get(0).get("val");
        return val != null ? val.intValue() : 0;
    }

    /**
     * 执行 MAX 聚合查询，返回 BigDecimal 结果
     */
    private static <T> BigDecimal aggregateDecimal(BaseMapper<T> mapper, QueryWrapper<T> wrapper) {
        List<Map<String, Object>> maps = mapper.selectMaps(wrapper);
        if (maps == null || maps.isEmpty()) {
            return BigDecimal.ZERO;
        }
        Object val = maps.get(0).get("val");
        if (val instanceof BigDecimal decimal) {
            return decimal;
        }
        if (val instanceof Number num) {
            return BigDecimal.valueOf(num.doubleValue());
        }
        return BigDecimal.ZERO;
    }

    /**
     * 将秒数格式化为可读字符串:
     * - 小于 60s: "Xs"（如 "30s"）
     * - 小于 3600s: "Xm Ys"（如 "5m 30s"）
     * - 大于等于 3600s: "Xh Ym"（如 "2h 30m"）
     */
    private static String formatDuration(int totalSeconds) {
        if (totalSeconds < 60) {
            return totalSeconds + "s";
        }
        int hours = totalSeconds / 3600;
        int minutes = (totalSeconds % 3600) / 60;
        int seconds = totalSeconds % 60;

        if (hours > 0) {
            return hours + "h " + minutes + "m";
        }
        if (seconds > 0) {
            return minutes + "m " + seconds + "s";
        }
        return minutes + "m";
    }
}
