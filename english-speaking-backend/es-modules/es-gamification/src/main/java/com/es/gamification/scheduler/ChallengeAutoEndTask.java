package com.es.gamification.scheduler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.event.PointsEvent;
import com.es.gamification.entity.ChallengeSubmission;
import com.es.gamification.entity.GroupChallenge;
import com.es.gamification.mapper.ChallengeSubmissionMapper;
import com.es.gamification.mapper.GroupChallengeMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 挑战自动结束定时任务（5.5 语音挑战增强）
 * 每分钟扫描一次，将已到期的挑战设为 ended，并发放前三名积分奖励
 * 第一名 +30, 第二名 +20, 第三名 +10
 */
@Slf4j
@Component
public class ChallengeAutoEndTask {

    private final GroupChallengeMapper challengeMapper;
    private final ChallengeSubmissionMapper submissionMapper;
    private final ApplicationEventPublisher eventPublisher;

    public ChallengeAutoEndTask(GroupChallengeMapper challengeMapper,
                                ChallengeSubmissionMapper submissionMapper,
                                ApplicationEventPublisher eventPublisher) {
        this.challengeMapper = challengeMapper;
        this.submissionMapper = submissionMapper;
        this.eventPublisher = eventPublisher;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoEndChallenges() {
        try {
            List<GroupChallenge> expiredChallenges = challengeMapper.selectList(
                new LambdaQueryWrapper<GroupChallenge>()
                    .lt(GroupChallenge::getEndsAt, LocalDateTime.now())
                    .eq(GroupChallenge::getStatus, "active"));

            for (GroupChallenge challenge : expiredChallenges) {
                endChallenge(challenge);
            }
        } catch (Exception e) {
            log.error("挑战自动结束扫描失败", e);
        }
    }

    private void endChallenge(GroupChallenge challenge) {
        Long challengeId = challenge.getId();

        // 更新挑战状态
        challenge.setStatus("ended");
        challengeMapper.updateById(challenge);
        log.info("挑战已到期结束: challengeId={}", challengeId);

        // 计算排名：每人取最高分
        List<ChallengeSubmission> allSubs = submissionMapper.selectList(
            new LambdaQueryWrapper<ChallengeSubmission>()
                .eq(ChallengeSubmission::getChallengeId, challengeId));

        // 按用户分组，取最高分
        Map<Long, Double> userBestScore = new LinkedHashMap<>();
        for (ChallengeSubmission s : allSubs) {
            double score = s.getScore() != null ? s.getScore().doubleValue() : 0;
            userBestScore.merge(s.getUserId(), score, Math::max);
        }

        // 按分数降序排列
        List<Map.Entry<Long, Double>> ranking = new ArrayList<>(userBestScore.entrySet());
        ranking.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        // 发放前三名积分
        for (int i = 0; i < Math.min(3, ranking.size()); i++) {
            Long userId = ranking.get(i).getKey();
            int points = switch (i) {
                case 0 -> 30;
                case 1 -> 20;
                case 2 -> 10;
                default -> 0;
            };

            log.info("挑战奖励: challengeId={}, userId={}, rank={}, points={}",
                challengeId, userId, i + 1, points);

            try {
                // 使用 eventPublisher 发放积分
                eventPublisher.publishEvent(
                    PointsEvent.levelPass(userId)
                        .withReferenceId(challengeId)
                        .withScore(ranking.get(i).getValue()));
            } catch (Exception e) {
                log.error("发放挑战积分失败: challengeId={}, userId={}", challengeId, userId, e);
            }
        }
    }
}
