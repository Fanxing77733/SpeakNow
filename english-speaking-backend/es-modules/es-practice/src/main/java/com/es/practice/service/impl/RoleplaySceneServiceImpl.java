package com.es.practice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.practice.dto.RoleplayHistoryVO;
import com.es.practice.dto.RoleplaySceneVO;
import com.es.practice.entity.ConversationSession;
import com.es.practice.entity.RoleplayScene;
import com.es.practice.mapper.ConversationSessionMapper;
import com.es.practice.mapper.RoleplaySceneMapper;
import com.es.practice.service.RoleplaySceneService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RoleplaySceneServiceImpl implements RoleplaySceneService {

    private static final Map<String, String> DIFFICULTY_LABELS = Map.of(
            "easy", "Easy",
            "normal", "Normal",
            "hard", "Hard"
    );

    private final RoleplaySceneMapper sceneMapper;
    private final ConversationSessionMapper sessionMapper;

    public RoleplaySceneServiceImpl(RoleplaySceneMapper sceneMapper, ConversationSessionMapper sessionMapper) {
        this.sceneMapper = sceneMapper;
        this.sessionMapper = sessionMapper;
    }

    @Override
    public List<RoleplaySceneVO> listScenes(String difficulty) {
        LambdaQueryWrapper<RoleplayScene> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RoleplayScene::getIsEnabled, 1);
        if (difficulty != null && !difficulty.isBlank()) {
            wrapper.eq(RoleplayScene::getDifficulty, difficulty);
        }
        wrapper.orderByAsc(RoleplayScene::getSortOrder);

        return sceneMapper.selectList(wrapper).stream()
                .map(this::toVO)
                .collect(Collectors.toList());
    }

    @Override
    public RoleplaySceneVO getSceneByKey(String sceneKey) {
        LambdaQueryWrapper<RoleplayScene> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RoleplayScene::getSceneKey, sceneKey)
                .eq(RoleplayScene::getIsEnabled, 1);
        RoleplayScene scene = sceneMapper.selectOne(wrapper);
        return scene != null ? toVO(scene) : null;
    }

    @Override
    public List<RoleplayHistoryVO> getHistory(Long userId, int page, int size) {
        LambdaQueryWrapper<ConversationSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ConversationSession::getUserId, userId)
                .eq(ConversationSession::getStatus, "completed")
                .isNotNull(ConversationSession::getRoleplaySceneId)
                .orderByDesc(ConversationSession::getCreatedAt);

        // MyBatis-Plus 分页
        com.baomidou.mybatisplus.extension.plugins.pagination.Page<ConversationSession> mpPage =
                new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, size);
        com.baomidou.mybatisplus.extension.plugins.pagination.Page<ConversationSession> result =
                sessionMapper.selectPage(mpPage, wrapper);

        // 批量加载场景名
        List<Long> sceneIds = result.getRecords().stream()
                .map(ConversationSession::getRoleplaySceneId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> sceneNameMap = Map.of();
        if (!sceneIds.isEmpty()) {
            sceneNameMap = sceneMapper.selectBatchIds(sceneIds).stream()
                    .collect(Collectors.toMap(RoleplayScene::getId, RoleplayScene::getNameZh));
        }

        List<RoleplayHistoryVO> list = new ArrayList<>();
        for (ConversationSession s : result.getRecords()) {
            RoleplayHistoryVO vo = new RoleplayHistoryVO();
            vo.setSessionId(s.getId());
            vo.setSceneKey(s.getScene());
            vo.setSceneNameZh(sceneNameMap.getOrDefault(s.getRoleplaySceneId(), s.getScene()));
            vo.setDifficulty(s.getDifficulty());
            vo.setTotalScore(s.getTotalScore());
            vo.setPassScore(s.getPassScore());
            vo.setIsPassed(s.getIsPassed() != null && s.getIsPassed() == 1);
            vo.setTotalRounds(s.getTotalRounds());
            vo.setCompletedRounds(s.getTotalRounds());
            vo.setGrammarScore(s.getGrammarScore());
            vo.setRelevanceScore(s.getRelevanceScore());
            vo.setFluencyScore(s.getFluencyScore());
            vo.setDurationSeconds(s.getTotalDurationSeconds());
            vo.setCreatedAt(s.getCreatedAt());
            list.add(vo);
        }
        return list;
    }

    @Override
    public long countHistory(Long userId) {
        LambdaQueryWrapper<ConversationSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ConversationSession::getUserId, userId)
                .eq(ConversationSession::getStatus, "completed")
                .isNotNull(ConversationSession::getRoleplaySceneId);
        return sessionMapper.selectCount(wrapper);
    }

    private RoleplaySceneVO toVO(RoleplayScene scene) {
        RoleplaySceneVO vo = new RoleplaySceneVO();
        vo.setId(scene.getId());
        vo.setSceneKey(scene.getSceneKey());
        vo.setNameZh(scene.getNameZh());
        vo.setNameEn(scene.getNameEn());
        vo.setDescriptionZh(scene.getDescriptionZh());
        vo.setDifficulty(scene.getDifficulty());
        vo.setDifficultyLabel(DIFFICULTY_LABELS.getOrDefault(scene.getDifficulty(), scene.getDifficulty()));
        vo.setUserRoleZh(scene.getUserRoleZh());
        vo.setAiRoleZh(scene.getAiRoleZh());
        vo.setAiPersonality(scene.getAiPersonality());
        vo.setObjectiveZh(scene.getObjectiveZh());
        vo.setTotalRounds(scene.getTotalRounds());
        vo.setPassScore(scene.getPassScore());
        vo.setIconEmoji(scene.getIconEmoji());
        vo.setCategory(scene.getCategory());
        return vo;
    }
}
