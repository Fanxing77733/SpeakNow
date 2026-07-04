package com.es.gamification.service;

import com.es.gamification.dto.LeaderboardEntry;
import com.es.gamification.dto.PkMatchVO;
import com.es.gamification.dto.WordListVO;

import java.util.List;

/**
 * 单词PK对战服务接口（V2.0 5.2）
 */
public interface PkService {

    /** 获取所有可用单词列表 */
    List<WordListVO> getWordLists();

    /** 发起/匹配对战 */
    PkMatchVO startMatch(Long userId, Long wordListId);

    /** 提交对战分数 */
    PkMatchVO submitPkResult(Long userId, Long matchId, double score);

    /** 查询对战状态 */
    PkMatchVO getMatchStatus(Long userId, Long matchId);

    /** 周排行榜 */
    List<LeaderboardEntry> getWeeklyLeaderboard(int limit);

    /** 月排行榜 */
    List<LeaderboardEntry> getMonthlyLeaderboard(int limit);
}
