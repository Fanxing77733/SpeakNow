package com.es.gamification.controller;

import com.es.common.dto.Result;
import com.es.gamification.dto.ChallengeVO;
import com.es.gamification.dto.DiscussionVO;
import com.es.gamification.dto.GroupDetailVO;
import com.es.gamification.dto.GroupVO;
import com.es.gamification.dto.JoinRequestVO;
import com.es.gamification.dto.TopicVO;
import com.es.gamification.service.CommunityService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    // ========== 小组详情 ==========

    @GetMapping("/groups/{groupId}")
    public Result<GroupDetailVO> getGroupDetail(@PathVariable Long groupId) {
        return Result.ok(communityService.getGroupDetail(groupId, getCurrentUserId()));
    }

    // ========== 创建小组 ==========

    @PostMapping("/groups")
    public Result<GroupVO> createGroup(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "");
        String visibility = body.getOrDefault("visibility", "public");
        String description = body.getOrDefault("description", "");
        return Result.ok(communityService.createGroup(getCurrentUserId(), name, visibility, description));
    }

    // ========== 加入/退出 ==========

    @PostMapping("/groups/{groupId}/join")
    public Result<Void> joinGroup(@PathVariable Long groupId) {
        communityService.joinGroup(getCurrentUserId(), groupId);
        return Result.ok();
    }

    @PostMapping("/groups/{groupId}/leave")
    public Result<Void> leaveGroup(@PathVariable Long groupId) {
        communityService.leaveGroup(getCurrentUserId(), groupId);
        return Result.ok();
    }

    // ========== 加入申请（私密组） ==========

    @PostMapping("/groups/{groupId}/join-request")
    public Result<Void> requestJoinGroup(@PathVariable Long groupId) {
        communityService.requestJoinGroup(getCurrentUserId(), groupId);
        return Result.ok();
    }

    @GetMapping("/groups/{groupId}/join-requests")
    public Result<List<JoinRequestVO>> getJoinRequests(@PathVariable Long groupId) {
        return Result.ok(communityService.getJoinRequests(getCurrentUserId(), groupId));
    }

    @PostMapping("/groups/{groupId}/join-requests/{reqId}/approve")
    public Result<Void> approveJoinRequest(@PathVariable Long groupId, @PathVariable Long reqId) {
        communityService.approveJoinRequest(getCurrentUserId(), groupId, reqId);
        return Result.ok();
    }

    @PostMapping("/groups/{groupId}/join-requests/{reqId}/reject")
    public Result<Void> rejectJoinRequest(@PathVariable Long groupId, @PathVariable Long reqId) {
        communityService.rejectJoinRequest(getCurrentUserId(), groupId, reqId);
        return Result.ok();
    }

    // ========== 组长管理 ==========

    @PostMapping("/groups/{groupId}/transfer")
    public Result<Void> transferOwnership(@PathVariable Long groupId, @RequestBody Map<String, Object> body) {
        Long newOwnerId = Long.parseLong(String.valueOf(body.getOrDefault("newOwnerId", "0")));
        communityService.transferOwnership(getCurrentUserId(), groupId, newOwnerId);
        return Result.ok();
    }

    @DeleteMapping("/groups/{groupId}")
    public Result<Void> disbandGroup(@PathVariable Long groupId) {
        communityService.disbandGroup(getCurrentUserId(), groupId);
        return Result.ok();
    }

    // ========== 话题 ==========

    @GetMapping("/groups/{groupId}/topics/latest")
    public Result<TopicVO> getLatestTopic(@PathVariable Long groupId) {
        return Result.ok(communityService.getLatestTopic(groupId));
    }

    // ========== 挑战 ==========

    @GetMapping("/groups/{groupId}/challenges")
    public Result<List<ChallengeVO>> getChallenges(@PathVariable Long groupId) {
        return Result.ok(communityService.getChallenges(groupId, getCurrentUserId()));
    }

    @PostMapping("/groups/{groupId}/challenges")
    public Result<ChallengeVO> createChallenge(@PathVariable Long groupId, @RequestBody Map<String, Object> body) {
        String title = String.valueOf(body.getOrDefault("title", ""));
        String description = String.valueOf(body.getOrDefault("description", ""));
        int contentId = Integer.parseInt(String.valueOf(body.getOrDefault("contentId", "1")));
        int durationHours = Integer.parseInt(String.valueOf(body.getOrDefault("durationHours", "168")));
        int maxSubmissions = Integer.parseInt(String.valueOf(body.getOrDefault("maxSubmissions", "3")));
        return Result.ok(communityService.createChallenge(
            getCurrentUserId(), groupId, title, description, contentId, durationHours, maxSubmissions));
    }

    @PostMapping("/challenges/{challengeId}/submit")
    public Result<ChallengeVO> submitChallenge(@PathVariable Long challengeId, @RequestBody Map<String, Object> body) {
        Long practiceId = Long.parseLong(String.valueOf(body.getOrDefault("practiceId", "0")));
        double score = Double.parseDouble(String.valueOf(body.getOrDefault("score", "0")));
        return Result.ok(communityService.submitChallengeResult(getCurrentUserId(), challengeId, practiceId, score));
    }

    @GetMapping("/challenges/{challengeId}/ranking")
    public Result<List<ChallengeVO>> getChallengeRanking(@PathVariable Long challengeId) {
        return Result.ok(communityService.getChallengeRanking(challengeId));
    }

    // ========== 讨论 ==========

    @GetMapping("/groups/{groupId}/discussions")
    public Result<List<DiscussionVO>> getDiscussions(@PathVariable Long groupId) {
        return Result.ok(communityService.getDiscussions(groupId));
    }

    @PostMapping("/groups/{groupId}/discussions")
    public Result<DiscussionVO> postDiscussion(@PathVariable Long groupId, @RequestBody Map<String, String> body) {
        String content = body.getOrDefault("content", "");
        return Result.ok(communityService.postDiscussion(getCurrentUserId(), groupId, content));
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long id)) throw new RuntimeException("未登录");
        return id;
    }
}
