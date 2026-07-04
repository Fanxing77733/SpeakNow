package com.es.gamification.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.event.PointsEvent;
import com.es.common.exception.BusinessException;
import com.es.gamification.dto.LeaderboardEntry;
import com.es.gamification.dto.PkMatchVO;
import com.es.gamification.dto.WordListVO;
import com.es.gamification.entity.PkMatch;
import com.es.gamification.entity.WordList;
import com.es.gamification.mapper.PkMatchMapper;
import com.es.gamification.mapper.WordListMapper;
import com.es.gamification.service.PkService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * PK 对战服务实现（V2.0 5.2）
 */
@Slf4j
@Service
public class PkServiceImpl implements PkService {

    private final PkMatchMapper pkMatchMapper;
    private final WordListMapper wordListMapper;
    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;
    private final ApplicationEventPublisher eventPublisher;

    public PkServiceImpl(PkMatchMapper pkMatchMapper, WordListMapper wordListMapper,
                         JdbcTemplate jdbcTemplate, StringRedisTemplate redisTemplate,
                         ApplicationEventPublisher eventPublisher) {
        this.pkMatchMapper = pkMatchMapper;
        this.wordListMapper = wordListMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.redisTemplate = redisTemplate;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public List<WordListVO> getWordLists() {
        List<WordList> lists = wordListMapper.selectList(null);
        return lists.stream().map(w -> {
            WordListVO vo = new WordListVO();
            vo.setId(w.getId());
            vo.setName(w.getName());
            vo.setDescription(w.getDescription());
            vo.setDifficulty(w.getDifficulty());
            vo.setWordCount(w.getWordCount() != null ? w.getWordCount() : 0);
            return vo;
        }).toList();
    }

    @Override
    public PkMatchVO startMatch(Long userId, Long wordListId) {
        // 1. 检查用户是否已有未完成的对战（waiting/matched）
        List<PkMatch> existing = pkMatchMapper.selectList(
                new LambdaQueryWrapper<PkMatch>()
                        .and(w -> w.eq(PkMatch::getPlayer1Id, userId).or().eq(PkMatch::getPlayer2Id, userId))
                        .in(PkMatch::getStatus, "waiting", "matched")
        );
        if (!existing.isEmpty()) {
            log.info("用户已有未完成对战: userId={}, matchId={}", userId, existing.get(0).getId());
            return toPkMatchVO(existing.get(0), userId);
        }

        // 2. 验证单词列表存在
        WordList wordList = wordListMapper.selectById(wordListId);
        if (wordList == null) {
            throw new BusinessException(404, "单词列表不存在");
        }

        // 3. 尝试从 Redis 匹配队列获取对手（阻塞等待最多10秒）
        String queueKey = "pk:queue:" + wordListId;
        Long opponentId = null;
        try {
            String opponentStr = redisTemplate.opsForList().rightPop(queueKey, 10, TimeUnit.SECONDS);
            if (opponentStr != null && !opponentStr.equals(userId.toString())) {
                opponentId = Long.valueOf(opponentStr);
            } else if (opponentStr != null && opponentStr.equals(userId.toString())) {
                // 匹配到自己的旧记录，重新入队
                redisTemplate.opsForList().leftPush(queueKey, userId.toString());
            }
        } catch (Exception e) {
            log.warn("Redis 匹配队列操作失败: wordListId={}", wordListId, e);
        }

        // 4. 创建对战记录
        PkMatch match = new PkMatch();
        match.setPlayer1Id(userId);
        match.setWordListId(wordListId);
        match.setCreatedAt(LocalDateTime.now());

        if (opponentId != null) {
            // 匹配成功
            match.setPlayer2Id(opponentId);
            match.setStatus("matched");
            pkMatchMapper.insert(match);
            log.info("PK 匹配成功: matchId={}, player1={}, player2={}", match.getId(), userId, opponentId);
        } else {
            // 无对手，进入等待队列
            match.setStatus("waiting");
            pkMatchMapper.insert(match);
            try {
                redisTemplate.opsForList().leftPush(queueKey, userId.toString());
            } catch (Exception e) {
                log.warn("Redis 入队失败: userId={}, wordListId={}", userId, wordListId, e);
            }
            log.info("PK 等待匹配: matchId={}, userId={}", match.getId(), userId);
        }

        return toPkMatchVO(match, userId);
    }

    @Override
    @Transactional
    public PkMatchVO submitPkResult(Long userId, Long matchId, double score) {
        // 1. 验证对战存在
        PkMatch match = pkMatchMapper.selectById(matchId);
        if (match == null) {
            throw new BusinessException(404, "对战记录不存在");
        }

        // 2. 验证用户权限
        boolean isPlayer1 = userId.equals(match.getPlayer1Id());
        boolean isPlayer2 = userId.equals(match.getPlayer2Id());
        if (!isPlayer1 && !isPlayer2) {
            throw new BusinessException(403, "无权操作此对战");
        }

        // 3. 验证状态允许提交
        if (!List.of("matched", "p1_submitted", "p2_submitted").contains(match.getStatus())) {
            throw new BusinessException(422, "当前对战状态不允许提交");
        }

        // 4. 更新得分
        if (isPlayer1) {
            match.setPlayer1Score(BigDecimal.valueOf(score));
            match.setPlayer1SubmittedAt(LocalDateTime.now());
        } else {
            match.setPlayer2Score(BigDecimal.valueOf(score));
            match.setPlayer2SubmittedAt(LocalDateTime.now());
        }

        // 5. 更新状态
        boolean p1Done = match.getPlayer1SubmittedAt() != null;
        boolean p2Done = match.getPlayer2SubmittedAt() != null;

        if (p1Done && p2Done) {
            match.setStatus("judging");
        } else if (isPlayer1) {
            match.setStatus("p1_submitted");
        } else {
            match.setStatus("p2_submitted");
        }

        pkMatchMapper.updateById(match);

        // 6. 双方都已提交，自动判决
        if ("judging".equals(match.getStatus())) {
            judgeMatch(match);
        }

        log.info("PK 提交分数: userId={}, matchId={}, score={}", userId, matchId, score);
        return toPkMatchVO(match, userId);
    }

    @Override
    public PkMatchVO getMatchStatus(Long userId, Long matchId) {
        PkMatch match = pkMatchMapper.selectById(matchId);
        if (match == null) {
            throw new BusinessException(404, "对战记录不存在");
        }
        if (!userId.equals(match.getPlayer1Id()) && !userId.equals(match.getPlayer2Id())) {
            throw new BusinessException(403, "无权查看此对战");
        }
        return toPkMatchVO(match, userId);
    }

    @Override
    public List<LeaderboardEntry> getWeeklyLeaderboard(int limit) {
        return queryLeaderboard(
                "SELECT t.user_id, COALESCE(u.nickname, u.email) AS user_name, SUM(t.points) AS pts " +
                "FROM user_points t LEFT JOIN users u ON t.user_id = u.id " +
                "WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
                "GROUP BY t.user_id ORDER BY pts DESC LIMIT ?",
                limit
        );
    }

    @Override
    public List<LeaderboardEntry> getMonthlyLeaderboard(int limit) {
        return queryLeaderboard(
                "SELECT t.user_id, COALESCE(u.nickname, u.email) AS user_name, SUM(t.points) AS pts " +
                "FROM user_points t LEFT JOIN users u ON t.user_id = u.id " +
                "WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) " +
                "GROUP BY t.user_id ORDER BY pts DESC LIMIT ?",
                limit
        );
    }

    // ======================== 私有方法 ========================

    /**
     * 判决对战结果并发布积分事件
     */
    private void judgeMatch(PkMatch match) {
        double s1 = match.getPlayer1Score() != null ? match.getPlayer1Score().doubleValue() : 0;
        double s2 = match.getPlayer2Score() != null ? match.getPlayer2Score().doubleValue() : 0;

        // 比较得分：高者胜，同分比提交时间早者胜
        String result;
        if (s1 > s2) {
            result = "p1_win";
        } else if (s2 > s1) {
            result = "p2_win";
        } else {
            // 同分，比较提交时间
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

        log.info("PK 判决完成: matchId={}, result={}, p1Score={}, p2Score={}", match.getId(), result, s1, s2);
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

            // 根据结果给予不同加成（仅影响实时排行榜展示，实际积分由 PointRule 决定）
            int player1Bonus = switch (result) {
                case "p1_win" -> 10;
                case "draw" -> 5;
                default -> 3;
            };
            int player2Bonus = switch (result) {
                case "p2_win" -> 10;
                case "draw" -> 5;
                default -> 3;
            };

            redisTemplate.opsForZSet().incrementScore(weeklyKey, match.getPlayer1Id().toString(), player1Bonus);
            redisTemplate.opsForZSet().incrementScore(monthlyKey, match.getPlayer1Id().toString(), player1Bonus);
            if (match.getPlayer2Id() != null) {
                redisTemplate.opsForZSet().incrementScore(weeklyKey, match.getPlayer2Id().toString(), player2Bonus);
                redisTemplate.opsForZSet().incrementScore(monthlyKey, match.getPlayer2Id().toString(), player2Bonus);
            }
        } catch (Exception e) {
            log.warn("更新 Redis 排行榜失败: matchId={}", match.getId(), e);
        }
    }

    /**
     * 查询排行榜数据
     */
    private List<LeaderboardEntry> queryLeaderboard(String sql, int limit) {
        List<LeaderboardEntry> list = new ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, Math.min(limit, 100));
            int rank = 1;
            for (Map<String, Object> row : rows) {
                LeaderboardEntry entry = new LeaderboardEntry();
                entry.setRank(rank++);
                entry.setUserId(((Number) row.get("user_id")).longValue());
                entry.setUserName(String.valueOf(row.getOrDefault("user_name", "匿名用户")));
                entry.setScore(((Number) row.get("pts")).intValue());
                list.add(entry);
            }
        } catch (Exception e) {
            log.warn("查询排行榜失败", e);
        }
        return list;
    }

    /**
     * 将 PkMatch 实体转换为 VO
     */
    private PkMatchVO toPkMatchVO(PkMatch match, Long currentUserId) {
        boolean isPlayer1 = currentUserId.equals(match.getPlayer1Id());

        PkMatchVO vo = new PkMatchVO();
        vo.setId(match.getId());
        vo.setStatus(match.getStatus());
        vo.setWordListId(match.getWordListId());

        // 单词列表名称
        vo.setWordListName(getWordListName(match.getWordListId()));

        // 我的得分和对手术得分
        if (isPlayer1) {
            vo.setMyScore(match.getPlayer1Score() != null ? match.getPlayer1Score().doubleValue() : null);
            vo.setOpponentScore(match.getPlayer2Score() != null ? match.getPlayer2Score().doubleValue() : null);
            vo.setOpponentName(getUserName(match.getPlayer2Id()));
        } else {
            vo.setMyScore(match.getPlayer2Score() != null ? match.getPlayer2Score().doubleValue() : null);
            vo.setOpponentScore(match.getPlayer1Score() != null ? match.getPlayer1Score().doubleValue() : null);
            vo.setOpponentName(getUserName(match.getPlayer1Id()));
        }

        // 对战结果
        vo.setResult(match.getResult());

        // 已获得积分（从 user_points 表查询）
        vo.setPointsEarned(getPointsEarned(currentUserId, match.getId()));

        return vo;
    }

    /**
     * 查询单词列表名称
     */
    private String getWordListName(Long wordListId) {
        if (wordListId == null) return "";
        try {
            WordList w = wordListMapper.selectById(wordListId);
            return w != null ? w.getName() : "";
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * 查询用户显示名称
     */
    private String getUserName(Long userId) {
        if (userId == null) return "等待中...";
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(nickname, email) AS name FROM users WHERE id = ?", userId);
            return String.valueOf(row.getOrDefault("name", "匿名用户"));
        } catch (Exception e) {
            return "匿名用户";
        }
    }

    /**
     * 查询对战获得的积分
     */
    private int getPointsEarned(Long userId, Long matchId) {
        try {
            Long pts = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(points), 0) FROM user_points WHERE user_id = ? AND reference_id = ?",
                    Long.class, userId, matchId);
            return pts != null ? pts.intValue() : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
