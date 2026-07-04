package com.es.gamification.service;

import com.es.gamification.dto.BadgeVO;
import com.es.gamification.dto.PointsVO;
import com.es.gamification.dto.StageVO;
import com.es.gamification.dto.LevelVO;
import com.es.gamification.dto.GroupVO;

import java.util.List;

public interface GamificationService {

    List<BadgeVO> getUserBadges(Long userId);

    PointsVO getUserPoints(Long userId);

    List<StageVO> getStages(Long userId);

    List<LevelVO> getLevels(Long userId);

    LevelVO getLevelDetail(Long userId, Long levelId);

    List<GroupVO> getGroups(Long userId, String visibility, String keyword);

    GroupVO createGroup(Long userId, String name, String visibility, String description);

    StageVO getStageDetail(Long userId, int stageId);

    void completeStageTask(Long userId, int stageId, int taskIndex);
}
