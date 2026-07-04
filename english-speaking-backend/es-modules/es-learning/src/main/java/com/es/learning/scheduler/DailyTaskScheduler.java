package com.es.learning.scheduler;

import com.es.learning.service.PredictionService;
import com.es.learning.service.RecommendationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * V2.0 定时任务调度
 * - 每日凌晨 2:00 离线计算推荐缓存
 * - 每日凌晨 3:00 计算学习效果预测
 */
@Slf4j
@Component
public class DailyTaskScheduler {

    private final RecommendationService recommendationService;
    private final PredictionService predictionService;

    public DailyTaskScheduler(RecommendationService recommendationService,
                               PredictionService predictionService) {
        this.recommendationService = recommendationService;
        this.predictionService = predictionService;
    }

    /** 每日 2:00 计算推荐缓存 */
    @Scheduled(cron = "0 0 2 * * ?")
    public void computeRecommendations() {
        log.info("[定时任务] 开始计算推荐缓存");
        try {
            recommendationService.computeAndCacheRecommendations();
        } catch (Exception e) {
            log.error("[定时任务] 推荐缓存计算失败", e);
        }
    }

    /** 每日 3:00 计算学习效果预测 */
    @Scheduled(cron = "0 0 3 * * ?")
    public void computePredictions() {
        log.info("[定时任务] 开始计算学习效果预测");
        try {
            predictionService.computePredictions();
        } catch (Exception e) {
            log.error("[定时任务] 学习效果预测计算失败", e);
        }
    }
}
