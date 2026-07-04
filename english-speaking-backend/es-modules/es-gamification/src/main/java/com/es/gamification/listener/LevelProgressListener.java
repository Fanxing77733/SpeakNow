package com.es.gamification.listener;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.event.BadgeCheckEvent;
import com.es.common.event.PointsEvent;
import com.es.gamification.entity.GameLevel;
import com.es.gamification.entity.UserLevelProgress;
import com.es.gamification.mapper.GameLevelMapper;
import com.es.gamification.mapper.UserLevelProgressMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 闯关进度异步监听器（V2.0）
 * 监听积分事件，自动更新关卡进度
 */
@Slf4j
@Component
public class LevelProgressListener {

    private final GameLevelMapper gameLevelMapper;
    private final UserLevelProgressMapper progressMapper;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    public LevelProgressListener(GameLevelMapper gameLevelMapper, UserLevelProgressMapper progressMapper,
                                  JdbcTemplate jdbcTemplate, ObjectMapper objectMapper,
                                  ApplicationEventPublisher eventPublisher) {
        this.gameLevelMapper = gameLevelMapper;
        this.progressMapper = progressMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
    }

    @Async
    @TransactionalEventListener
    public void onPracticeOrConversationCompleted(PointsEvent event) {
        if (event.getType() != PointsEvent.EventType.PRACTICE_COMPLETED
                && event.getType() != PointsEvent.EventType.CONVERSATION_COMPLETED) {
            return;
        }
        try {
            updateProgressForUser(event.getUserId(), event.getScore());
        } catch (Exception e) {
            log.error("关卡进度更新失败: userId={}", event.getUserId(), e);
        }
    }

    private void updateProgressForUser(Long userId, Double score) {
        List<GameLevel> levels = gameLevelMapper.selectList(
                new LambdaQueryWrapper<GameLevel>().eq(GameLevel::getIsActive, 1)
                        .orderByAsc(GameLevel::getStageId, GameLevel::getLevelOrder));

        if (levels.isEmpty()) return;

        // 获取当前正在进行的关卡
        UserLevelProgress current = progressMapper.selectOne(
                new LambdaQueryWrapper<UserLevelProgress>()
                        .eq(UserLevelProgress::getUserId, userId)
                        .eq(UserLevelProgress::getStatus, "in_progress"));

        if (current == null) {
            // 找到第一个unlocked的关卡，开始进行
            UserLevelProgress first = progressMapper.selectOne(
                    new LambdaQueryWrapper<UserLevelProgress>()
                            .eq(UserLevelProgress::getUserId, userId)
                            .eq(UserLevelProgress::getStatus, "unlocked"));
            if (first != null) {
                first.setStatus("in_progress");
                progressMapper.updateById(first);
                current = first;
            } else {
                // 初始化第一个关卡
                GameLevel firstLevel = levels.get(0);
                current = initProgress(userId, firstLevel);
                current.setStatus("in_progress");
                progressMapper.updateById(current);
            }
        }

        if (current == null || score == null) return;

        // 更新进度
        GameLevel level = gameLevelMapper.selectById(current.getLevelId());
        if (level == null) return;

        int newCompleted = current.getCompletedTasks() + 1;
        BigDecimal newAvg;
        if (current.getAvgScore() == null) {
            newAvg = BigDecimal.valueOf(score);
        } else {
            newAvg = current.getAvgScore()
                    .multiply(BigDecimal.valueOf(current.getCompletedTasks()))
                    .add(BigDecimal.valueOf(score))
                    .divide(BigDecimal.valueOf(newCompleted), 2, RoundingMode.HALF_UP);
        }

        current.setCompletedTasks(newCompleted);
        current.setAvgScore(newAvg);

        // 检查通关条件
        BigDecimal passRate = level.getPassCompletionRate();
        BigDecimal passScore = level.getPassAvgScore();
        int totalTasks = current.getTotalTasks() > 0 ? current.getTotalTasks() : 3;

        double completionRate = (double) newCompleted / totalTasks;
        boolean passed = completionRate >= passRate.doubleValue()
                && newAvg.doubleValue() >= passScore.doubleValue();

        if (passed) {
            current.setStatus("completed");
            current.setCompletedAt(LocalDateTime.now());
            progressMapper.updateById(current);

            // 发放通关积分
            eventPublisher.publishEvent(PointsEvent.levelPass(userId)
                    .withScore(newAvg.doubleValue())
                    .withCompletionRate(completionRate)
                    .withReferenceId(current.getLevelId()));

            // 发放关卡勋章
            if (level.getRewardBadgeType() != null) {
                eventPublisher.publishEvent(BadgeCheckEvent.levelCompleted(userId));
            }

            // 解锁下一关
            unlockNextLevel(userId, level);
            log.info("关卡通关: userId={}, levelId={}, avgScore={}", userId, level.getId(), newAvg);
        } else {
            progressMapper.updateById(current);
        }
    }

    private UserLevelProgress initProgress(Long userId, GameLevel level) {
        try {
            List<Map<String, Object>> tasks = objectMapper.readValue(level.getTasksJson(),
                    new TypeReference<List<Map<String, Object>>>() {});
            int totalTasks = tasks.size();

            UserLevelProgress progress = new UserLevelProgress();
            progress.setUserId(userId);
            progress.setLevelId(level.getId());
            progress.setStatus("unlocked");
            progress.setCompletedTasks(0);
            progress.setTotalTasks(totalTasks);
            progress.setCreatedAt(LocalDateTime.now());
            progress.setUpdatedAt(LocalDateTime.now());
            progressMapper.insert(progress);
            return progress;
        } catch (Exception e) {
            log.warn("关卡任务解析失败: levelId={}", level.getId(), e);
            return null;
        }
    }

    private void unlockNextLevel(Long userId, GameLevel currentLevel) {
        GameLevel nextLevel = gameLevelMapper.selectOne(
                new LambdaQueryWrapper<GameLevel>()
                        .eq(GameLevel::getIsActive, 1)
                        .eq(GameLevel::getStageId, currentLevel.getStageId())
                        .eq(GameLevel::getLevelOrder, currentLevel.getLevelOrder() + 1));

        if (nextLevel == null) {
            // 当前阶段最后一关，解锁下一阶段第一关
            nextLevel = gameLevelMapper.selectOne(
                    new LambdaQueryWrapper<GameLevel>()
                            .eq(GameLevel::getIsActive, 1)
                            .eq(GameLevel::getStageId, currentLevel.getStageId() + 1)
                            .eq(GameLevel::getLevelOrder, 1));
        }

        if (nextLevel != null) {
            UserLevelProgress existing = progressMapper.selectOne(
                    new LambdaQueryWrapper<UserLevelProgress>()
                            .eq(UserLevelProgress::getUserId, userId)
                            .eq(UserLevelProgress::getLevelId, nextLevel.getId()));
            if (existing == null) {
                initProgress(userId, nextLevel);
            }
        }
    }
}
