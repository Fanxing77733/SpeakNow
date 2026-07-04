package com.es.gamification.controller;

import com.es.common.dto.Result;
import com.es.gamification.dto.LeaderboardEntry;
import com.es.gamification.dto.PkMatchVO;
import com.es.gamification.dto.WordListVO;
import com.es.gamification.service.PkService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * PK 对战控制器（V2.0 5.2）
 */
@RestController
@RequestMapping("/api/v1/pk")
public class PkController {

    private final PkService pkService;

    public PkController(PkService pkService) {
        this.pkService = pkService;
    }

    /** 获取可用的单词列表 */
    @GetMapping("/word-lists")
    public Result<List<WordListVO>> getWordLists() {
        return Result.ok(pkService.getWordLists());
    }

    /** 发起匹配 / 开始对战 */
    @PostMapping("/start")
    public Result<PkMatchVO> startMatch(@RequestBody Map<String, Object> body) {
        Long wordListId = body.get("wordListId") != null
                ? ((Number) body.get("wordListId")).longValue() : null;
        if (wordListId == null) {
            return Result.fail(400, "请选择单词列表");
        }
        return Result.ok(pkService.startMatch(getCurrentUserId(), wordListId));
    }

    /** 提交对战分数 */
    @PostMapping("/{matchId}/submit")
    public Result<PkMatchVO> submitPkResult(@PathVariable Long matchId,
                                            @RequestBody Map<String, Object> body) {
        Double score = body.get("score") != null
                ? ((Number) body.get("score")).doubleValue() : null;
        if (score == null) {
            return Result.fail(400, "请提供得分");
        }
        if (score < 0 || score > 100) {
            return Result.fail(400, "得分必须在 0-100 之间");
        }
        return Result.ok(pkService.submitPkResult(getCurrentUserId(), matchId, score));
    }

    /** 查询对战状态 */
    @GetMapping("/{matchId}/status")
    public Result<PkMatchVO> getMatchStatus(@PathVariable Long matchId) {
        return Result.ok(pkService.getMatchStatus(getCurrentUserId(), matchId));
    }

    /** 周排行榜 */
    @GetMapping("/leaderboard/weekly")
    public Result<List<LeaderboardEntry>> getWeeklyLeaderboard(@RequestParam(defaultValue = "20") int limit) {
        return Result.ok(pkService.getWeeklyLeaderboard(limit));
    }

    /** 月排行榜 */
    @GetMapping("/leaderboard/monthly")
    public Result<List<LeaderboardEntry>> getMonthlyLeaderboard(@RequestParam(defaultValue = "20") int limit) {
        return Result.ok(pkService.getMonthlyLeaderboard(limit));
    }

    /** 从 SecurityContext 获取当前登录用户 ID */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long id)) {
            throw new RuntimeException("未登录");
        }
        return id;
    }
}
