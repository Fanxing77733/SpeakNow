package com.es.gamification.controller;

import com.es.common.dto.Result;
import com.es.gamification.dto.*;
import com.es.gamification.service.GamificationService;
import com.es.gamification.service.PointsShopService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class GamificationController {

    private final GamificationService gamificationService;
    private final PointsShopService pointsShopService;
    private final JdbcTemplate jdbcTemplate;

    public GamificationController(GamificationService gamificationService, PointsShopService pointsShopService,
                                   JdbcTemplate jdbcTemplate) {
        this.gamificationService = gamificationService;
        this.pointsShopService = pointsShopService;
        this.jdbcTemplate = jdbcTemplate;
    }

    // ========== 勋章 ==========

    @GetMapping("/badges")
    public Result<List<BadgeVO>> getBadges() {
        return Result.ok(gamificationService.getUserBadges(getCurrentUserId()));
    }

    // ========== 积分 ==========

    @GetMapping("/points")
    public Result<PointsVO> getPoints() {
        return Result.ok(gamificationService.getUserPoints(getCurrentUserId()));
    }

    @GetMapping("/points/history")
    public Result<List<PointsHistoryVO>> getPointsHistory(@RequestParam(defaultValue = "1") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        Long userId = getCurrentUserId();
        int offset = Math.max(0, (page - 1) * size);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, points, reason, reference_id, created_at FROM user_points WHERE user_id = ? " +
            "ORDER BY created_at DESC LIMIT ? OFFSET ?", userId, size, offset);
        List<PointsHistoryVO> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            PointsHistoryVO vo = new PointsHistoryVO();
            vo.setId(((Number) row.get("id")).longValue());
            vo.setPoints(((Number) row.get("points")).intValue());
            vo.setReason((String) row.get("reason"));
            vo.setReferenceId(row.get("reference_id") != null ? ((Number) row.get("reference_id")).longValue() : null);
            if (row.get("created_at") != null) {
                vo.setCreatedAt(row.get("created_at").toString().replace("T", " ").substring(0, 19));
            }
            list.add(vo);
        }
        return Result.ok(list);
    }

    // ========== 关卡 ==========

    @GetMapping("/stages")
    public Result<List<StageVO>> getStages() {
        return Result.ok(gamificationService.getStages(getCurrentUserId()));
    }

    @GetMapping("/stages/{stageId}")
    public Result<StageVO> getStageDetail(@PathVariable int stageId) {
        return Result.ok(gamificationService.getStageDetail(getCurrentUserId(), stageId));
    }

    @PostMapping("/stages/{stageId}/tasks/{taskIndex}/complete")
    public Result<Void> completeStageTask(@PathVariable int stageId, @PathVariable int taskIndex) {
        gamificationService.completeStageTask(getCurrentUserId(), stageId, taskIndex);
        return Result.ok();
    }

    // ========== 关卡管理（V2.0 DB驱动）==========

    @GetMapping("/levels")
    public Result<List<LevelVO>> getLevels() {
        return Result.ok(gamificationService.getLevels(getCurrentUserId()));
    }

    @GetMapping("/levels/{levelId}")
    public Result<LevelVO> getLevelDetail(@PathVariable Long levelId) {
        return Result.ok(gamificationService.getLevelDetail(getCurrentUserId(), levelId));
    }

    // ========== 学习小组 ==========

    @GetMapping("/groups")
    public Result<List<GroupVO>> getGroups(@RequestParam(defaultValue = "") String visibility,
                                           @RequestParam(defaultValue = "") String keyword) {
        return Result.ok(gamificationService.getGroups(getCurrentUserId(), visibility, keyword));
    }

    // ========== 积分商城（V2.0）==========

    @GetMapping("/shop/items")
    public Result<List<ShopItemVO>> getShopItems() {
        return Result.ok(pointsShopService.getShopItems(getCurrentUserId()));
    }

    @PostMapping("/shop/items/{itemId}/purchase")
    public Result<Void> purchaseItem(@PathVariable Long itemId) {
        pointsShopService.purchaseItem(getCurrentUserId(), itemId);
        return Result.ok();
    }

    @GetMapping("/shop/my-items")
    public Result<List<ShopItemVO>> getMyItems() {
        return Result.ok(pointsShopService.getMyItems(getCurrentUserId()));
    }

    // ========== 排行榜（V2.0）==========

    @GetMapping("/leaderboard")
    public Result<List<LeaderboardVO>> getLeaderboard(@RequestParam(defaultValue = "total") String type,
                                                       @RequestParam(defaultValue = "20") int limit) {
        String sql = "SELECT t.user_id, COALESCE(u.nickname, u.email) AS user_name, t.pts AS score FROM (" +
                     "  SELECT user_id, COALESCE(SUM(points), 0) AS pts FROM user_points GROUP BY user_id" +
                     ") t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.pts DESC LIMIT ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, limit);

        List<LeaderboardVO> list = new ArrayList<>();
        int rank = 1;
        for (Map<String, Object> row : rows) {
            LeaderboardVO vo = new LeaderboardVO();
            vo.setRank(rank++);
            vo.setUserId(((Number) row.get("user_id")).longValue());
            vo.setUserName(String.valueOf(row.getOrDefault("user_name", "匿名用户")));
            vo.setScore(((Number) row.get("score")).intValue());
            list.add(vo);
        }
        return Result.ok(list);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long id)) throw new RuntimeException("未登录");
        return id;
    }
}
