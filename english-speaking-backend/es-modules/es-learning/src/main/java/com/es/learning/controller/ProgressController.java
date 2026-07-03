package com.es.learning.controller;

import com.es.common.dto.Result;
import com.es.learning.dto.ProgressSummaryVO;
import com.es.learning.service.ProgressService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private final ProgressService progressService;
    private final JdbcTemplate jdbcTemplate;

    public ProgressController(ProgressService progressService, JdbcTemplate jdbcTemplate) {
        this.progressService = progressService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/summary")
    public Result<ProgressSummaryVO> getSummary() {
        return Result.ok(progressService.getSummary(getCurrentUserId()));
    }

    /** 五维能力雷达图 — 从 practice_records 聚合真实均值 */
    @GetMapping("/radar")
    public Result<Map<String, Object>> getRadar() {
        Long userId = getCurrentUserId();
        Map<String, Object> radar = new LinkedHashMap<>();
        try {
            Map<String, Object> avg = jdbcTemplate.queryForMap(
                "SELECT COALESCE(AVG(accuracy_score), 0) AS accuracy, " +
                "COALESCE(AVG(fluency_score), 0) AS fluency, " +
                "COALESCE(AVG(completeness_score), 0) AS completeness, " +
                "COALESCE(AVG(stress_score), 0) AS stress, " +
                "COALESCE(AVG(intonation_score), 0) AS intonation " +
                "FROM practice_records WHERE user_id = ? AND status = 'completed'", userId);
            radar.put("accuracy", toInt(avg.get("accuracy")));
            radar.put("fluency", toInt(avg.get("fluency")));
            radar.put("completeness", toInt(avg.get("completeness")));
            radar.put("stress", toInt(avg.get("stress")));
            radar.put("intonation", toInt(avg.get("intonation")));
        } catch (Exception e) {
            // 无数据时返回默认值
            radar.put("accuracy", 0); radar.put("fluency", 0);
            radar.put("completeness", 0); radar.put("stress", 0); radar.put("intonation", 0);
        }

        List<Map<String, Object>> radarData = Arrays.asList(
            Map.of("dimension", "准确度", "score", radar.get("accuracy"), "fullMark", 100),
            Map.of("dimension", "流利度", "score", radar.get("fluency"), "fullMark", 100),
            Map.of("dimension", "完整度", "score", radar.get("completeness"), "fullMark", 100),
            Map.of("dimension", "重音", "score", radar.get("stress"), "fullMark", 100),
            Map.of("dimension", "语调", "score", radar.get("intonation"), "fullMark", 100)
        );
        return Result.ok(Map.of("dimensions", radar, "radarData", radarData));
    }

    /** 练习趋势 — 从 practice_records 按日聚合真实数据 */
    @GetMapping("/trend")
    public Result<List<Map<String, Object>>> getTrend(@RequestParam(defaultValue = "week") String period) {
        Long userId = getCurrentUserId();
        int days = "month".equals(period) ? 30 : 7;

        List<Map<String, Object>> trend = new ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT DATE(created_at) AS d, COUNT(*) AS cnt, COALESCE(AVG(total_score), 0) AS avg_score " +
                "FROM practice_records WHERE user_id = ? AND status = 'completed' " +
                "AND created_at >= DATE_SUB(CURDATE(), INTERVAL " + days + " DAY) " +
                "GROUP BY DATE(created_at) ORDER BY d", userId);
            for (Map<String, Object> row : rows) {
                trend.add(Map.of(
                    "date", String.valueOf(row.get("d")).substring(5),
                    "count", row.get("cnt"),
                    "avgScore", row.get("avg_score") instanceof BigDecimal bd ? bd : BigDecimal.valueOf(((Number) row.get("avg_score")).doubleValue())
                ));
            }
        } catch (Exception e) {
            log.warn("查询趋势数据失败: userId={}", userId, e);
        }
        if (trend.isEmpty()) {
            // 无数据时返回空趋势
            for (int i = days - 1; i >= 0; i--) {
                String date = java.time.LocalDate.now().minusDays(i).toString().substring(5);
                trend.add(Map.of("date", date, "count", 0, "avgScore", BigDecimal.ZERO));
            }
        }
        return Result.ok(trend);
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        return 0;
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long id) return id;
        throw new RuntimeException("未获取到登录用户信息");
    }
}
