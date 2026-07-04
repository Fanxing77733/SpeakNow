package com.es.gamification.scheduler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.event.PointsEvent;
import com.es.common.exception.BusinessException;
import com.es.gamification.entity.PkMatch;
import com.es.gamification.mapper.PkMatchMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * PK 对战超时检测定时任务（每30秒执行一次）
 */
@Slf4j
@Component
public class PkMatchTimeoutTask {

    private final PkMatchMapper pkMatchMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final StringRedisTemplate redisTemplate;

    public PkMatchTimeoutTask(PkMatchMapper pkMatchMapper, ApplicationEventPublisher eventPublisher,
                               StringRedisTemplate redisTemplate) {
        this.pkMatchMapper = pkMatchMapper;
        this.eventPublisher = eventPublisher;
        this.redisTemplate = redisTemplate;
    }

    /**
     * 每30秒检查一次超时的对战
     * 状态为 p1_submitted 或 p2_submitted 且 createdAt 超过5分钟，
     * 且另一方未提交的 → AI 模拟对手得分并判决
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void checkTimeouts() {
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);

        // 查询可能的超时对战：状态已有一方提交，且创建时间超过5分钟
        List<PkMatch> staleMatches;
        try {
            staleMatches = pkMatchMapper.selectList(
                    new LambdaQueryWrapper<PkMatch>()
                            .in(PkMatch::getStatus, "p1_submitted", "p2_submitted")
                            .lt(PkMatch::getCreatedAt, fiveMinutesAgo)
            );
        } catch (Exception e) {
            log.warn("查询超时对战失败", e);
            return;
        }

        if (staleMatches.isEmpty()) return;

        for (PkMatch match : staleMatches) {
            try {
                // 过滤：只处理另一方确实未提交的情况
                if ("p1_submitted".equals(match.getStatus()) && match.getPlayer2SubmittedAt() == null) {
                    simulateOpponentAndJudge(match, false);
                } else if ("p2_submitted".equals(match.getStatus()) && match.getPlayer1SubmittedAt() == null) {
                    simulateOpponentAndJudge(match, true);
                }
            } catch (Exception e) {
                log.error("处理超时对战失败: matchId={}", match.getId(), e);
            }
        }
    }

    /**
     * AI 模拟对手得分并判决
     * @param match 对战记录
     * @param simulatePlayer1 true=模拟玩家1得分, false=模拟玩家2得分
     */
    private void simulateOpponentAndJudge(PkMatch match, boolean simulatePlayer1) {
        // 模拟得分 40-85 随机
        double simulatedScore = 40 + Math.random() * 45;
        simulatedScore = Math.round(simulatedScore * 100.0) / 100.0; // 保留2位小数

        if (simulatePlayer1) {
            match.setPlayer1Score(BigDecimal.valueOf(simulatedScore));
            match.setPlayer1SubmittedAt(LocalDateTime.now());
        } else {
            match.setPlayer2Score(BigDecimal.valueOf(simulatedScore));
            match.setPlayer2SubmittedAt(LocalDateTime.now());
        }

        // 判决
        judge(match);

        log.info("超时对战已判决: matchId={}, simulatedPlayer1={}, simulatedScore={}, result={}",
                match.getId(), simulatePlayer1, simulatedScore, match.getResult());
    }

    /**
     * 判决对战结果并发布积分事件
     */
    private void judge(PkMatch match) {
        double s1 = match.getPlayer1Score() != null ? match.getPlayer1Score().doubleValue() : 0;
        double s2 = match.getPlayer2Score() != null ? match.getPlayer2Score().doubleValue() : 0;

        // 比较得分：高者胜，同分比提交时间早者胜
        String result;
        if (s1 > s2) {
            result = "p1_win";
        } else if (s2 > s1) {
            result = "p2_win";
        } else {
            LocalDateTime t1 = match.getPlayer1SubmittedAt();
            LocalDateTime t2 = match.getPlayer2SubmittedAt();
            if (t1 != null && t2 != null) {
                result = t1.isBefore(t2) ? "p1_win" : "p2_win";
            } else {
                result = "draw";
            }
        }

        match.setResult(result);
        match.setStatus("completed");
        match.setJudgedAt(LocalDateTime.now());
        pkMatchMapper.updateById(match);

        // 发布积分事件
        publishPkPointsEvent(match, result);

        // 尝试更新 Redis 排行榜
        tryUpdateRedisLeaderboard(match, result);
    }

    /**
     * 发布 PK 积分事件
     */
    private void publishPkPointsEvent(PkMatch match, String result) {
        switch (result) {
            case "p1_win" -> {
                eventPublisher.publishEvent(PointsEvent.pkWin(match.getPlayer1Id()).withReferenceId(match.getId()));
                if (match.getPlayer2Id() != null) {
                    eventPublisher.publishEvent(PointsEvent.pkLose(match.getPlayer2Id()).withReferenceId(match.getId()));
                }
            }
            case "p2_win" -> {
                if (match.getPlayer2Id() != null) {
                    eventPublisher.publishEvent(PointsEvent.pkWin(match.getPlayer2Id()).withReferenceId(match.getId()));
                }
                eventPublisher.publishEvent(PointsEvent.pkLose(match.getPlayer1Id()).withReferenceId(match.getId()));
            }
            default -> {
                eventPublisher.publishEvent(PointsEvent.pkDraw(match.getPlayer1Id()).withReferenceId(match.getId()));
                if (match.getPlayer2Id() != null) {
                    eventPublisher.publishEvent(PointsEvent.pkDraw(match.getPlayer2Id()).withReferenceId(match.getId()));
                }
            }
        }
    }

    /**
     * 尝试更新 Redis 排行榜（优雅降级）
     */
    private void tryUpdateRedisLeaderboard(PkMatch match, String result) {
        try {
            String weeklyKey = "leaderboard:weekly";
            String monthlyKey = "leaderboard:monthly";

            int p1Bonus = "p1_win".equals(result) ? 10 : ("draw".equals(result) ? 5 : 3);
            int p2Bonus = "p2_win".equals(result) ? 10 : ("draw".equals(result) ? 5 : 3);

            redisTemplate.opsForZSet().incrementScore(weeklyKey, match.getPlayer1Id().toString(), p1Bonus);
            redisTemplate.opsForZSet().incrementScore(monthlyKey, match.getPlayer1Id().toString(), p1Bonus);
            if (match.getPlayer2Id() != null) {
                redisTemplate.opsForZSet().incrementScore(weeklyKey, match.getPlayer2Id().toString(), p2Bonus);
                redisTemplate.opsForZSet().incrementScore(monthlyKey, match.getPlayer2Id().toString(), p2Bonus);
            }
        } catch (Exception e) {
            log.warn("更新 Redis 排行榜失败: matchId={}", match.getId(), e);
        }
    }
}
