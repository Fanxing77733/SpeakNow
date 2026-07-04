package com.es.gamification.service;

import com.es.gamification.dto.ChallengeVO;
import com.es.gamification.dto.DiscussionVO;
import com.es.gamification.dto.GroupDetailVO;
import com.es.gamification.dto.GroupVO;
import com.es.gamification.dto.JoinRequestVO;
import com.es.gamification.dto.TopicVO;

import java.util.List;

public interface CommunityService {

    GroupDetailVO getGroupDetail(Long groupId, Long userId);

    void joinGroup(Long userId, Long groupId);

    void leaveGroup(Long userId, Long groupId);

    List<ChallengeVO> getChallenges(Long groupId, Long userId);

    ChallengeVO createChallenge(Long userId, Long groupId, String title, String description,
                                int contentId, int durationHours, int maxSubmissions);

    ChallengeVO submitChallengeResult(Long userId, Long challengeId, Long practiceId, double score);

    List<DiscussionVO> getDiscussions(Long groupId);

    DiscussionVO postDiscussion(Long userId, Long groupId, String content);

    List<ChallengeVO> getChallengeRanking(Long challengeId);

    // ========== 5.4 学习小组增强 ==========

    /** 申请加入私密小组（创建 GroupJoinRequest，status=pending） */
    void requestJoinGroup(Long userId, Long groupId);

    /** 查看申请列表（owner/admin） */
    List<JoinRequestVO> getJoinRequests(Long userId, Long groupId);

    /** 审批通过 */
    void approveJoinRequest(Long userId, Long groupId, Long requestId);

    /** 审批拒绝 */
    void rejectJoinRequest(Long userId, Long groupId, Long requestId);

    /** 转让组长 */
    void transferOwnership(Long userId, Long groupId, Long newOwnerUserId);

    /** 解散小组 */
    void disbandGroup(Long userId, Long groupId);

    /** 获取最新话题 */
    TopicVO getLatestTopic(Long groupId);

    /** 创建小组（增强：支持 visibility 和 description） */
    GroupVO createGroup(Long userId, String name, String visibility, String description);
}
