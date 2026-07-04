package com.es.gamification.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.gamification.dto.*;
import com.es.gamification.entity.*;
import com.es.gamification.mapper.*;
import com.es.gamification.service.GamificationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class GamificationServiceImpl implements GamificationService {

    private final UserBadgeMapper badgeMapper;
    private final UserPointsMapper pointsMapper;
    private final StudyGroupMapper groupMapper;
    private final GameLevelMapper gameLevelMapper;
    private final UserLevelProgressMapper progressMapper;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    private static final String[] STAGE_NAMES = {"入门发音", "情景对话", "语法进阶", "综合实战"};
    private static final String[] STAGE_BADGES = {"发音初学者", "对话新人", "语法达人", "全能战士"};
    private static final int[] STAGE_REWARD_POINTS = {20, 30, 40, 50};

    // 每个关卡的 3 个具体任务（名称、类型、场景/内容）
    private static final String[][][] STAGE_TASK_DEFS = {
        // 第1关：入门发音
        {
            {"练习基础单词发音", "practice"},
            {"跟读简单日常句子", "practice"},
            {"完成自我介绍对话", "conversation"},
        },
        // 第2关：情景对话
        {
            {"校园生活情景对话", "conversation"},
            {"餐厅点餐情景对话", "conversation"},
            {"日常问候交流对话", "conversation"},
        },
        // 第3关：语法进阶
        {
            {"基础语法错误纠正", "grammar"},
            {"英语时态使用纠正", "grammar"},
            {"句式结构优化练习", "grammar"},
        },
        // 第4关：综合实战
        {
            {"商务英语情景对话", "conversation"},
            {"综合发音评测挑战", "practice"},
            {"高级语法纠错练习", "grammar"},
        },
    };

    public GamificationServiceImpl(UserBadgeMapper badgeMapper, UserPointsMapper pointsMapper,
                                    StudyGroupMapper groupMapper, GameLevelMapper gameLevelMapper,
                                    UserLevelProgressMapper progressMapper, JdbcTemplate jdbcTemplate,
                                    ObjectMapper objectMapper) {
        this.badgeMapper = badgeMapper;
        this.pointsMapper = pointsMapper;
        this.groupMapper = groupMapper;
        this.gameLevelMapper = gameLevelMapper;
        this.progressMapper = progressMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void initDefaultGroups() {
        try {
            Long count = groupMapper.selectCount(null);
            if (count != null && count == 0) {
                String[][] defaults = {
                    {"每日英语打卡群", "坚持每日打卡，互相监督学习"},
                    {"四六级口语冲刺", "备战四六级口语考试，一起刷题"},
                    {"商务英语交流组", "职场英语口语练习与交流"},
                    {"旅行英语爱好者", "旅行场景英语口语练习"},
                    {"零基础英语入门", "从零开始，轻松学英语"},
                };
                for (String[] g : defaults) {
                    StudyGroup group = new StudyGroup();
                    group.setName(g[0]);
                    group.setDescription(g[1]);
                    group.setOwnerId(1L);
                    group.setVisibility("public");
                    group.setMemberCount((int) (Math.random() * 30) + 3);
                    group.setCreatedAt(LocalDateTime.now());
                    groupMapper.insert(group);
                }
                log.info("已初始化 {} 个默认学习小组", defaults.length);
            }
        } catch (Exception e) {
            log.warn("初始化默认学习小组失败: {}", e.getMessage());
        }
    }

    @Override
    public List<BadgeVO> getUserBadges(Long userId) {
        autoAwardBadges(userId);
        List<UserBadge> badges = badgeMapper.selectList(
                new LambdaQueryWrapper<UserBadge>().eq(UserBadge::getUserId, userId));
        return badges.stream().map(b -> {
            BadgeVO vo = new BadgeVO();
            vo.setBadgeType(b.getBadgeType());
            vo.setBadgeName(b.getBadgeName());
            vo.setEarnedAt(b.getEarnedAt() != null ? b.getEarnedAt().format(DateTimeFormatter.ISO_DATE) : null);
            return vo;
        }).toList();
    }

    @Override
    public PointsVO getUserPoints(Long userId) {
        int total = 0;
        try {
            Long sum = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(points), 0) FROM user_points WHERE user_id = ?", Long.class, userId);
            total = sum != null ? sum.intValue() : 0;
        } catch (Exception e) {
            total = calcPoints(userId);
        }
        int totalRank = 0;
        try {
            Long rank = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) + 1 FROM (" +
                "  SELECT user_id, COALESCE(SUM(points), 0) AS pts FROM user_points GROUP BY user_id" +
                ") t WHERE t.pts > ?", Long.class, total);
            totalRank = rank != null ? rank.intValue() : 0;
        } catch (Exception ignored) {}
        PointsVO vo = new PointsVO();
        vo.setTotalPoints(total);
        vo.setTotalRank(totalRank);
        return vo;
    }

    @Override
    public List<StageVO> getStages(Long userId) {
        int practiceCount = countCompleted(userId, "practice_records");
        int conversationCount = countCompleted(userId, "conversation_sessions");
        int grammarCount = countCompleted(userId, "grammar_error_book");

        List<StageVO> stages = new ArrayList<>();
        boolean prevCompleted = true;

        for (int i = 0; i < 4; i++) {
            String[][] taskDefs = STAGE_TASK_DEFS[i];
            int completed = 0;

            // 统计本关卡中每种类型已完成了几次（同类型任务按序分配）
            int[] typeUsed = new int[3]; // practice=0, conversation=1, grammar=2

            List<StageTaskVO> taskList = new ArrayList<>();
            for (int t = 0; t < 3; t++) {
                String taskName = taskDefs[t][0];
                String type = taskDefs[t][1];
                int typeIdx = typeIndex(type);
                typeUsed[typeIdx]++;

                int userCount = switch (type) {
                    case "practice" -> practiceCount;
                    case "conversation" -> conversationCount;
                    case "grammar" -> grammarCount;
                    default -> 0;
                };
                boolean done = userCount >= typeUsed[typeIdx];

                StageTaskVO task = new StageTaskVO();
                task.setIndex(t);
                task.setName(taskName);
                task.setType(type);
                task.setDescription("前往「" + typeLabel(type) + "」完成练习后自动标记");
                task.setCompleted(done);
                taskList.add(task);
                if (done) completed++;
            }

            StageVO s = new StageVO();
            s.setId(i + 1);
            s.setName(STAGE_NAMES[i]);
            s.setOrder(i + 1);
            s.setTaskCount(3);
            s.setCompletedCount(completed);
            s.setUnlocked(prevCompleted);
            s.setCompleted(completed >= 3);
            s.setRewardBadge(STAGE_BADGES[i]);
            s.setRewardPoints(STAGE_REWARD_POINTS[i]);
            s.setTasks(taskList);
            stages.add(s);

            if (!s.isCompleted()) prevCompleted = false;

            if (s.isCompleted()) {
                awardBadgeIfNew(userId, "stage_" + (i + 1) + "_clear", STAGE_BADGES[i]);
            }
        }
        return stages;
    }

    @Override
    public StageVO getStageDetail(Long userId, int stageId) {
        if (stageId < 1 || stageId > 4) throw new RuntimeException("关卡不存在");
        List<StageVO> all = getStages(userId);
        StageVO stage = all.stream().filter(s -> s.getId() == stageId).findFirst().orElse(null);
        if (stage == null) throw new RuntimeException("关卡不存在");
        if (!stage.isUnlocked()) throw new RuntimeException("请先通关前置关卡");
        return stage;
    }

    @Override
    @Transactional
    public void completeStageTask(Long userId, int stageId, int taskIndex) {
        // 任务完成由实际练习记录自动检测，此接口保留但无需手动调用
    }

    // ====== 关卡管理（V2.0 DB驱动）======

    @Override
    public List<LevelVO> getLevels(Long userId) {
        List<GameLevel> levels = gameLevelMapper.selectList(
                new LambdaQueryWrapper<GameLevel>().eq(GameLevel::getIsActive, 1)
                        .orderByAsc(GameLevel::getStageId, GameLevel::getLevelOrder));

        if (levels.isEmpty()) return new ArrayList<>();

        // 确保用户有初始进度记录
        ensureUserProgressInitialized(userId, levels);

        // 查询所有进度
        List<UserLevelProgress> progressList = progressMapper.selectList(
                new LambdaQueryWrapper<UserLevelProgress>().eq(UserLevelProgress::getUserId, userId));

        Map<Long, UserLevelProgress> progressMap = new HashMap<>();
        for (UserLevelProgress p : progressList) {
            progressMap.put(p.getLevelId(), p);
        }

        return levels.stream().map(level -> toLevelVO(level, progressMap.get(level.getId()))).toList();
    }

    @Override
    public LevelVO getLevelDetail(Long userId, Long levelId) {
        GameLevel level = gameLevelMapper.selectById(levelId);
        if (level == null) throw new RuntimeException("关卡不存在");

        UserLevelProgress progress = progressMapper.selectOne(
                new LambdaQueryWrapper<UserLevelProgress>()
                        .eq(UserLevelProgress::getUserId, userId)
                        .eq(UserLevelProgress::getLevelId, levelId));

        if (progress == null || "locked".equals(progress.getStatus()))
            throw new RuntimeException("关卡未解锁");

        return toLevelVO(level, progress);
    }

    private void ensureUserProgressInitialized(Long userId, List<GameLevel> levels) {
        Long count = progressMapper.selectCount(
                new LambdaQueryWrapper<UserLevelProgress>().eq(UserLevelProgress::getUserId, userId));
        if (count > 0) return;

        // 初始化第一个关卡
        GameLevel first = levels.get(0);
        UserLevelProgress progress = new UserLevelProgress();
        progress.setUserId(userId);
        progress.setLevelId(first.getId());
        progress.setStatus("unlocked");
        progress.setCompletedTasks(0);
        progress.setTotalTasks(getTaskCount(first));
        progress.setCreatedAt(LocalDateTime.now());
        progress.setUpdatedAt(LocalDateTime.now());
        progressMapper.insert(progress);
    }

    private LevelVO toLevelVO(GameLevel level, UserLevelProgress progress) {
        LevelVO vo = new LevelVO();
        vo.setId(level.getId());
        vo.setStageId(level.getStageId());
        vo.setLevelOrder(level.getLevelOrder());
        vo.setName(level.getName());
        vo.setDescription(level.getDescription());
        vo.setPassCompletionRate(level.getPassCompletionRate());
        vo.setPassAvgScore(level.getPassAvgScore());
        vo.setRewardBadgeType(level.getRewardBadgeType());
        vo.setRewardBadgeName(level.getRewardBadgeName());
        vo.setRewardPoints(level.getRewardBasePoints());

        // 解析任务
        try {
            List<Map<String, Object>> tasks = objectMapper.readValue(level.getTasksJson(),
                    new TypeReference<List<Map<String, Object>>>() {});
            List<StageTaskVO> taskVOList = new ArrayList<>();
            for (int i = 0; i < tasks.size(); i++) {
                Map<String, Object> task = tasks.get(i);
                StageTaskVO taskVO = new StageTaskVO();
                taskVO.setIndex(i);
                taskVO.setName((String) task.get("name"));
                taskVO.setType((String) task.get("type"));
                taskVO.setDescription("前往「" + typeLabel((String) task.get("type")) + "」完成练习");
                taskVO.setCompleted(false);
                taskVOList.add(taskVO);
            }
            vo.setTasks(taskVOList);
            vo.setTotalTasks(tasks.size());
        } catch (Exception e) {
            vo.setTasks(new ArrayList<>());
            vo.setTotalTasks(3);
        }

        if (progress != null) {
            vo.setStatus(progress.getStatus());
            vo.setCompletedTasks(progress.getCompletedTasks());
            vo.setTotalTasks(progress.getTotalTasks() > 0 ? progress.getTotalTasks() : vo.getTotalTasks());
            vo.setAvgScore(progress.getAvgScore());

            // 标记已完成的任务
            int completed = progress.getCompletedTasks();
            List<StageTaskVO> taskList = vo.getTasks();
            for (int i = 0; i < Math.min(completed, taskList.size()); i++) {
                taskList.get(i).setCompleted(true);
            }
        } else {
            vo.setStatus("locked");
            vo.setCompletedTasks(0);
        }

        return vo;
    }

    private int getTaskCount(GameLevel level) {
        try {
            List<?> tasks = objectMapper.readValue(level.getTasksJson(), List.class);
            return tasks.size();
        } catch (Exception e) { return 3; }
    }

    @Override
    public List<GroupVO> getGroups(Long userId, String visibility, String keyword) {
        LambdaQueryWrapper<StudyGroup> wrapper = new LambdaQueryWrapper<>();
        if (visibility != null && !visibility.isBlank()) {
            wrapper.eq(StudyGroup::getVisibility, visibility);
        }
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(StudyGroup::getName, keyword)
                .or().like(StudyGroup::getDescription, keyword));
        }
        wrapper.orderByDesc(StudyGroup::getMemberCount);
        List<StudyGroup> groups = groupMapper.selectList(wrapper);

        // 查询用户已加入的小组ID集合
        Set<Long> joinedGroupIds = new HashSet<>();
        if (userId != null) {
            try {
                List<GroupMember> memberships = jdbcTemplate.query(
                    "SELECT group_id FROM group_members WHERE user_id = ?",
                    (rs, rowNum) -> {
                        GroupMember m = new GroupMember();
                        m.setGroupId(rs.getLong("group_id"));
                        return m;
                    }, userId);
                for (GroupMember m : memberships) {
                    joinedGroupIds.add(m.getGroupId());
                }
            } catch (Exception e) {
                log.warn("查询用户加入状态失败: userId={}", userId, e);
            }
        }

        final Set<Long> finalJoined = joinedGroupIds;
        return groups.stream().map(g -> {
            GroupVO vo = new GroupVO();
            vo.setId(g.getId());
            vo.setName(g.getName());
            vo.setDescription(g.getDescription());
            vo.setMemberCount(g.getMemberCount() != null ? g.getMemberCount() : 1);
            vo.setVisibility(g.getVisibility());
            vo.setJoined(finalJoined.contains(g.getId()));
            return vo;
        }).toList();
    }

    @Override
    @Transactional
    public GroupVO createGroup(Long userId, String name, String visibility, String description) {
        if (name == null || name.trim().isEmpty()) throw new RuntimeException("小组名称不能为空");
        if (name.trim().length() < 2 || name.trim().length() > 20) throw new RuntimeException("小组名称2-20个字符");
        if (visibility == null || visibility.trim().isEmpty()) visibility = "public";
        if (!"public".equals(visibility) && !"private".equals(visibility))
            throw new RuntimeException("可见性只能为 public 或 private");
        if (description != null && description.length() > 200) throw new RuntimeException("小组简介不超过200字符");

        // 检查用户小组数量上限
        Long userGroupCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM group_members WHERE user_id = ?", Long.class, userId);
        if (userGroupCount != null && userGroupCount >= 5)
            throw new RuntimeException("最多加入5个小组");

        StudyGroup group = new StudyGroup();
        group.setName(name.trim());
        group.setDescription(description != null ? description.trim() : "");
        group.setOwnerId(userId);
        group.setVisibility(visibility);
        group.setMemberCount(1);
        group.setTopicPushEnabled(false);
        groupMapper.insert(group);

        // 创建者自动成为 owner（通过 JdbcTemplate 插入，避免引入新的实体依赖）
        jdbcTemplate.update(
            "INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)",
            group.getId(), userId, "owner", LocalDateTime.now());

        GroupVO vo = new GroupVO();
        vo.setId(group.getId());
        vo.setName(group.getName());
        vo.setMemberCount(1);
        vo.setVisibility(visibility);
        vo.setJoined(true);
        return vo;
    }

    // ====== 私有方法 ======

    private int typeIndex(String type) {
        return switch (type) {
            case "practice" -> 0;
            case "conversation" -> 1;
            case "grammar" -> 2;
            default -> 0;
        };
    }

    private String typeLabel(String type) {
        return switch (type) {
            case "practice" -> "发音评测";
            case "conversation" -> "情景对话";
            case "grammar" -> "语法纠错";
            default -> "练习";
        };
    }

    private int countCompleted(Long userId, String tableName) {
        try {
            String cond = "";
            if ("practice_records".equals(tableName)) cond = " AND status = 'completed'";
            else if ("conversation_sessions".equals(tableName)) cond = " AND status = 'completed'";
            Long cnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE user_id = ?" + cond,
                Long.class, userId);
            return cnt != null ? cnt.intValue() : 0;
        } catch (Exception e) { return 0; }
    }

    private int calcPoints(Long userId) {
        return countCompleted(userId, "practice_records") * 10
             + countCompleted(userId, "conversation_sessions") * 20;
    }

    private void autoAwardBadges(Long userId) {
        try {
            List<UserBadge> existing = badgeMapper.selectList(
                new LambdaQueryWrapper<UserBadge>().eq(UserBadge::getUserId, userId));
            List<String> types = existing.stream().map(UserBadge::getBadgeType).toList();

            int pc = countCompleted(userId, "practice_records");
            int cc = countCompleted(userId, "conversation_sessions");

            if (!types.contains("first_practice") && pc > 0)
                awardBadgeIfNew(userId, "first_practice", "初出茅庐");
            if (!types.contains("first_conversation") && cc > 0)
                awardBadgeIfNew(userId, "first_conversation", "初次交谈");
            if (!types.contains("practice_master") && pc >= 10)
                awardBadgeIfNew(userId, "practice_master", "练习达人");
            if (!types.contains("conversation_pro") && cc >= 5)
                awardBadgeIfNew(userId, "conversation_pro", "对话高手");
            if (!types.contains("assessment_done")) {
                Long ac = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM assessment_records WHERE user_id = ?", Long.class, userId);
                if (ac != null && ac > 0) awardBadgeIfNew(userId, "assessment_done", "英语测评官");
            }
            if (!types.contains("streak_7")) {
                try {
                    Long sc = jdbcTemplate.queryForObject(
                        "SELECT COUNT(DISTINCT checkin_date) FROM daily_checkins WHERE user_id = ? " +
                        "AND checkin_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)", Long.class, userId);
                    if (sc != null && sc >= 7) awardBadgeIfNew(userId, "streak_7", "坚持不懈");
                } catch (Exception ignored) {}
            }
            if (!types.contains("pronunciation_pro")) {
                try {
                    Long cnt = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM practice_records WHERE user_id = ? AND status = 'completed' " +
                        "AND total_score >= 85", Long.class, userId);
                    if (cnt != null && cnt >= 10) awardBadgeIfNew(userId, "pronunciation_pro", "发音达人");
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.warn("自动颁发勋章失败: userId={}", userId, e);
        }
    }

    private void awardBadgeIfNew(Long userId, String type, String name) {
        Long exists = badgeMapper.selectCount(new LambdaQueryWrapper<UserBadge>()
            .eq(UserBadge::getUserId, userId).eq(UserBadge::getBadgeType, type));
        if (exists != null && exists > 0) return;
        UserBadge badge = new UserBadge();
        badge.setUserId(userId);
        badge.setBadgeType(type);
        badge.setBadgeName(name);
        badge.setEarnedAt(LocalDateTime.now());
        badgeMapper.insert(badge);
        log.info("勋章已颁发: userId={}, badge={}", userId, name);
        awardPoints(userId, 10, "获得勋章: " + name);
    }

    private void awardPoints(Long userId, int amount, String reason) {
        UserPoints points = new UserPoints();
        points.setUserId(userId);
        points.setPoints(amount);
        points.setReason(reason);
        points.setCreatedAt(LocalDateTime.now());
        pointsMapper.insert(points);
    }
}
