package com.es.gamification.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.event.PointsEvent;
import com.es.gamification.dto.ChallengeVO;
import com.es.gamification.dto.DiscussionVO;
import com.es.gamification.dto.GroupDetailVO;
import com.es.gamification.dto.GroupVO;
import com.es.gamification.dto.JoinRequestVO;
import com.es.gamification.dto.TopicVO;
import com.es.gamification.entity.*;
import com.es.gamification.mapper.*;
import com.es.gamification.service.CommunityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class CommunityServiceImpl implements CommunityService {

    private final StudyGroupMapper groupMapper;
    private final GroupMemberMapper memberMapper;
    private final GroupChallengeMapper challengeMapper;
    private final ChallengeSubmissionMapper submissionMapper;
    private final GroupDiscussionMapper discussionMapper;
    private final GroupJoinRequestMapper joinRequestMapper;
    private final GroupTopicMapper topicMapper;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventPublisher eventPublisher;

    public CommunityServiceImpl(StudyGroupMapper groupMapper, GroupMemberMapper memberMapper,
                                GroupChallengeMapper challengeMapper, ChallengeSubmissionMapper submissionMapper,
                                GroupDiscussionMapper discussionMapper,
                                GroupJoinRequestMapper joinRequestMapper, GroupTopicMapper topicMapper,
                                JdbcTemplate jdbcTemplate, ApplicationEventPublisher eventPublisher) {
        this.groupMapper = groupMapper;
        this.memberMapper = memberMapper;
        this.challengeMapper = challengeMapper;
        this.submissionMapper = submissionMapper;
        this.discussionMapper = discussionMapper;
        this.joinRequestMapper = joinRequestMapper;
        this.topicMapper = topicMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.eventPublisher = eventPublisher;
    }

    // ========== 小组查询 ==========

    @Override
    public GroupDetailVO getGroupDetail(Long groupId, Long userId) {
        StudyGroup group = groupMapper.selectById(groupId);
        if (group == null) return null;

        GroupDetailVO vo = new GroupDetailVO();
        vo.setId(group.getId());
        vo.setName(group.getName());
        vo.setDescription(group.getDescription());
        vo.setMemberCount(group.getMemberCount() != null ? group.getMemberCount() : 1);
        vo.setVisibility(group.getVisibility());
        vo.setOwnerId(group.getOwnerId());
        vo.setTopicPushEnabled(group.getTopicPushEnabled() != null && group.getTopicPushEnabled());

        // 查询创建者昵称
        try {
            String ownerName = jdbcTemplate.queryForObject(
                "SELECT COALESCE(nickname, email) FROM users WHERE id = ?",
                String.class, group.getOwnerId());
            vo.setOwnerName(ownerName != null ? ownerName : "未知");
        } catch (Exception e) {
            vo.setOwnerName("未知");
        }

        // 判断当前用户角色和成员状态
        if (userId != null) {
            // 1. 首先尝试 MyBatis-Plus 查询
            GroupMember myMember = memberMapper.selectOne(new LambdaQueryWrapper<GroupMember>()
                .eq(GroupMember::getGroupId, groupId)
                .eq(GroupMember::getUserId, userId));

            if (myMember != null) {
                vo.setMember(true);
                vo.setMyRole(myMember.getRole());
            } else {
                // 2. 回退：如果 MyBatis-Plus 未查到，用 JdbcTemplate 再查一次
                try {
                    Map<String, Object> row = jdbcTemplate.queryForMap(
                        "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?",
                        groupId, userId);
                    String role = String.valueOf(row.get("role"));
                    vo.setMember(true);
                    vo.setMyRole(role);
                } catch (Exception e) {
                    // 3. 如果 owner 就是当前用户，自动标记为成员+owner
                    if (group.getOwnerId().equals(userId)) {
                        vo.setMember(true);
                        vo.setMyRole("owner");
                    } else {
                        vo.setMember(false);
                        vo.setMyRole(null);
                    }
                }
            }
        }

        // 加载挑战列表
        vo.setChallenges(getChallenges(groupId, userId));

        // 加载讨论列表
        vo.setDiscussions(getDiscussions(groupId));

        return vo;
    }

    // ========== 加入/退出小组 ==========

    @Override
    @Transactional
    public void joinGroup(Long userId, Long groupId) {
        StudyGroup group = groupMapper.selectById(groupId);
        if (group == null) throw new RuntimeException("小组不存在");

        // 检查是否是创建者
        if (group.getOwnerId().equals(userId))
            throw new RuntimeException("您是小组创建者，无需重复加入");

        // 检查是否已是成员
        Long alreadyMember = memberMapper.selectCount(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));
        if (alreadyMember != null && alreadyMember > 0)
            throw new RuntimeException("您已是小组成员");

        // 检查是否已有待审批申请
        Long pendingRequest = joinRequestMapper.selectCount(new LambdaQueryWrapper<GroupJoinRequest>()
            .eq(GroupJoinRequest::getGroupId, groupId)
            .eq(GroupJoinRequest::getUserId, userId)
            .eq(GroupJoinRequest::getStatus, "pending"));
        if (pendingRequest != null && pendingRequest > 0)
            throw new RuntimeException("已提交申请，请等待审批");

        // private 组：创建加入申请，不直接加入
        if ("private".equals(group.getVisibility())) {
            GroupJoinRequest req = new GroupJoinRequest();
            req.setGroupId(groupId);
            req.setUserId(userId);
            req.setStatus("pending");
            req.setRequestedAt(LocalDateTime.now());
            joinRequestMapper.insert(req);
            log.info("加入申请已提交: userId={}, groupId={}", userId, groupId);
            return;
        }

        // public 组：直接加入
        directJoinGroup(userId, group);
    }

    @Override
    @Transactional
    public void requestJoinGroup(Long userId, Long groupId) {
        StudyGroup group = groupMapper.selectById(groupId);
        if (group == null) throw new RuntimeException("小组不存在");

        // 检查是否是创建者
        if (group.getOwnerId().equals(userId))
            throw new RuntimeException("您是小组创建者，无需申请加入");

        // 检查是否已是成员
        Long alreadyMember = memberMapper.selectCount(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));
        if (alreadyMember != null && alreadyMember > 0)
            throw new RuntimeException("您已是小组成员");

        // 检查是否已有待审批申请
        Long pendingRequest = joinRequestMapper.selectCount(new LambdaQueryWrapper<GroupJoinRequest>()
            .eq(GroupJoinRequest::getGroupId, groupId)
            .eq(GroupJoinRequest::getUserId, userId)
            .eq(GroupJoinRequest::getStatus, "pending"));
        if (pendingRequest != null && pendingRequest > 0)
            throw new RuntimeException("已提交申请，请等待审批");

        GroupJoinRequest req = new GroupJoinRequest();
        req.setGroupId(groupId);
        req.setUserId(userId);
        req.setStatus("pending");
        req.setRequestedAt(LocalDateTime.now());
        joinRequestMapper.insert(req);
        log.info("加入申请已提交: userId={}, groupId={}", userId, groupId);
    }

    @Override
    @Transactional
    public void leaveGroup(Long userId, Long groupId) {
        StudyGroup group = groupMapper.selectById(groupId);
        if (group == null) return;

        String role = getMemberRole(groupId, userId);
        if (role == null) throw new RuntimeException("您不是小组成员");
        if ("owner".equals(role))
            throw new RuntimeException("组长不能退出小组，请先转让组长或解散小组");

        // 删除 member 记录（MyBatis-Plus）
        memberMapper.delete(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));

        // 更新冗余计数
        int currentCount = group.getMemberCount() != null ? group.getMemberCount() : 1;
        group.setMemberCount(Math.max(1, currentCount - 1));
        groupMapper.updateById(group);

        log.info("用户退出小组: userId={}, groupId={}", userId, groupId);
    }

    // ========== 审批管理 ==========

    @Override
    public List<JoinRequestVO> getJoinRequests(Long userId, Long groupId) {
        // 验证权限：必须是 owner 或 admin
        GroupMember myMember = memberMapper.selectOne(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));
        if (myMember == null) throw new RuntimeException("您不是小组成员");
        String role = myMember.getRole();
        if (!"owner".equals(role) && !"admin".equals(role))
            throw new RuntimeException("仅组长和管理员可以查看申请列表");

        List<GroupJoinRequest> requests = joinRequestMapper.selectList(
            new LambdaQueryWrapper<GroupJoinRequest>()
                .eq(GroupJoinRequest::getGroupId, groupId)
                .eq(GroupJoinRequest::getStatus, "pending")
                .orderByDesc(GroupJoinRequest::getRequestedAt));

        List<JoinRequestVO> result = new ArrayList<>();
        for (GroupJoinRequest req : requests) {
            JoinRequestVO vo = new JoinRequestVO();
            vo.setId(req.getId());
            vo.setUserId(req.getUserId());
            vo.setStatus(req.getStatus());
            vo.setRequestedAt(req.getRequestedAt() != null
                ? req.getRequestedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
            try {
                String name = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(nickname, email) FROM users WHERE id = ?", String.class, req.getUserId());
                vo.setUserName(name != null ? name : "匿名");
            } catch (Exception e) {
                vo.setUserName("匿名");
            }
            result.add(vo);
        }
        return result;
    }

    @Override
    @Transactional
    public void approveJoinRequest(Long userId, Long groupId, Long requestId) {
        // 验证权限
        GroupMember myMember = memberMapper.selectOne(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));
        if (myMember == null) throw new RuntimeException("您不是小组成员");
        String role = myMember.getRole();
        if (!"owner".equals(role) && !"admin".equals(role))
            throw new RuntimeException("仅组长和管理员可以审批");

        GroupJoinRequest req = joinRequestMapper.selectById(requestId);
        if (req == null || !req.getGroupId().equals(groupId))
            throw new RuntimeException("申请不存在");
        if (!"pending".equals(req.getStatus()))
            throw new RuntimeException("申请已处理");

        // 更新申请状态
        req.setStatus("approved");
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewerId(userId);
        joinRequestMapper.updateById(req);

        // 直接加入小组
        StudyGroup group = groupMapper.selectById(groupId);
        if (group == null) throw new RuntimeException("小组不存在");
        directJoinGroup(req.getUserId(), group);

        log.info("加入申请已通过: requestId={}, userId={}, reviewerId={}", requestId, req.getUserId(), userId);
    }

    @Override
    @Transactional
    public void rejectJoinRequest(Long userId, Long groupId, Long requestId) {
        GroupMember myMember = memberMapper.selectOne(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));
        if (myMember == null) throw new RuntimeException("您不是小组成员");
        String role = myMember.getRole();
        if (!"owner".equals(role) && !"admin".equals(role))
            throw new RuntimeException("仅组长和管理员可以审批");

        GroupJoinRequest req = joinRequestMapper.selectById(requestId);
        if (req == null || !req.getGroupId().equals(groupId))
            throw new RuntimeException("申请不存在");
        if (!"pending".equals(req.getStatus()))
            throw new RuntimeException("申请已处理");

        req.setStatus("rejected");
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewerId(userId);
        joinRequestMapper.updateById(req);

        log.info("加入申请已拒绝: requestId={}, userId={}, reviewerId={}", requestId, req.getUserId(), userId);
    }

    // ========== 组长管理 ==========

    @Override
    @Transactional
    public void transferOwnership(Long userId, Long groupId, Long newOwnerUserId) {
        StudyGroup group = groupMapper.selectById(groupId);
        if (group == null) throw new RuntimeException("小组不存在");
        if (!group.getOwnerId().equals(userId))
            throw new RuntimeException("仅组长可以转让");

        // 验证新 owner 是成员
        GroupMember newOwnerMember = memberMapper.selectOne(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, newOwnerUserId));
        if (newOwnerMember == null)
            throw new RuntimeException("新组长必须是当前小组成员");

        // 更新 StudyGroup.ownerId
        group.setOwnerId(newOwnerUserId);
        groupMapper.updateById(group);

        // 旧 owner 角色改为 admin
        GroupMember oldOwnerMember = memberMapper.selectOne(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));
        if (oldOwnerMember != null) {
            oldOwnerMember.setRole("admin");
            memberMapper.updateById(oldOwnerMember);
        }

        // 新 owner 角色改为 owner
        newOwnerMember.setRole("owner");
        memberMapper.updateById(newOwnerMember);

        log.info("小组组长已转让: groupId={}, oldOwner={}, newOwner={}", groupId, userId, newOwnerUserId);
    }

    @Override
    @Transactional
    public void disbandGroup(Long userId, Long groupId) {
        StudyGroup group = groupMapper.selectById(groupId);
        if (group == null) throw new RuntimeException("小组不存在");
        if (!group.getOwnerId().equals(userId))
            throw new RuntimeException("仅组长可以解散小组");

        // 级联删除关联数据（discussions、members、challenges、submissions、joinRequests、topics）
        discussionMapper.delete(new LambdaQueryWrapper<GroupDiscussion>()
            .eq(GroupDiscussion::getGroupId, groupId));

        // 删除小组内所有挑战及其提交
        List<GroupChallenge> challenges = challengeMapper.selectList(
            new LambdaQueryWrapper<GroupChallenge>().eq(GroupChallenge::getGroupId, groupId));
        for (GroupChallenge c : challenges) {
            submissionMapper.delete(new LambdaQueryWrapper<ChallengeSubmission>()
                .eq(ChallengeSubmission::getChallengeId, c.getId()));
        }
        challengeMapper.delete(new LambdaQueryWrapper<GroupChallenge>()
            .eq(GroupChallenge::getGroupId, groupId));

        memberMapper.delete(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId));

        joinRequestMapper.delete(new LambdaQueryWrapper<GroupJoinRequest>()
            .eq(GroupJoinRequest::getGroupId, groupId));

        topicMapper.delete(new LambdaQueryWrapper<GroupTopic>()
            .eq(GroupTopic::getGroupId, groupId));

        // 删除小组
        groupMapper.deleteById(groupId);

        log.info("小组已解散: groupId={}, ownerId={}", groupId, userId);
    }

    // ========== 话题 ==========

    @Override
    public TopicVO getLatestTopic(Long groupId) {
        GroupTopic topic = topicMapper.selectOne(
            new LambdaQueryWrapper<GroupTopic>()
                .eq(GroupTopic::getGroupId, groupId)
                .orderByDesc(GroupTopic::getPushedAt)
                .last("LIMIT 1"));

        if (topic == null) return null;

        TopicVO vo = new TopicVO();
        vo.setId(topic.getId());
        vo.setTopicContent(topic.getTopicContent());
        vo.setPushedAt(topic.getPushedAt() != null
            ? topic.getPushedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
        return vo;
    }

    // ========== 创建小组（增强） ==========

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
        Long userGroupCount = memberMapper.selectCount(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getUserId, userId));
        if (userGroupCount != null && userGroupCount >= 5)
            throw new RuntimeException("最多加入5个小组");

        StudyGroup group = new StudyGroup();
        group.setName(name.trim());
        group.setDescription(description != null ? description.trim() : "");
        group.setOwnerId(userId);
        group.setVisibility(visibility);
        group.setMemberCount(1);
        group.setTopicPushEnabled(false);
        group.setCreatedAt(LocalDateTime.now());
        groupMapper.insert(group);

        // 创建者自动成为 owner
        GroupMember member = new GroupMember();
        member.setGroupId(group.getId());
        member.setUserId(userId);
        member.setRole("owner");
        member.setJoinedAt(LocalDateTime.now());
        memberMapper.insert(member);

        log.info("小组已创建: groupId={}, name={}, visibility={}", group.getId(), name, visibility);

        GroupVO vo = new GroupVO();
        vo.setId(group.getId());
        vo.setName(group.getName());
        vo.setMemberCount(1);
        vo.setVisibility(visibility);
        vo.setJoined(true);
        return vo;
    }

    // ========== 挑战管理 ==========

    @Override
    public List<ChallengeVO> getChallenges(Long groupId, Long userId) {
        List<GroupChallenge> challenges = challengeMapper.selectList(
            new LambdaQueryWrapper<GroupChallenge>()
                .eq(GroupChallenge::getGroupId, groupId)
                .orderByDesc(GroupChallenge::getCreatedAt));

        List<ChallengeVO> result = new ArrayList<>();
        for (GroupChallenge c : challenges) {
            ChallengeVO vo = toChallengeVO(c, userId);
            result.add(vo);
        }
        return result;
    }

    @Override
    @Transactional
    public ChallengeVO createChallenge(Long userId, Long groupId, String title, String description,
                                       int contentId, int durationHours, int maxSubmissions) {
        // 校验: 只有组长或管理员可以发起
        String role = getMemberRole(groupId, userId);
        if (role == null) throw new RuntimeException("请先加入小组");
        if (!"owner".equals(role) && !"admin".equals(role))
            throw new RuntimeException("仅组长和管理员可以发起挑战");

        // 参数校验
        if (title == null || title.trim().isEmpty()) throw new RuntimeException("挑战标题不能为空");
        if (title.trim().length() > 100) throw new RuntimeException("挑战标题不超过100字符");
        if (durationHours < 24 || durationHours > 168) throw new RuntimeException("挑战持续时间需在24-168小时之间");
        if (maxSubmissions < 1 || maxSubmissions > 5) throw new RuntimeException("每人最多提交次数需在1-5次之间");

        GroupChallenge challenge = new GroupChallenge();
        challenge.setGroupId(groupId);
        challenge.setCreatedBy(userId);
        challenge.setTitle(title.trim());
        challenge.setDescription(description != null ? description.trim() : "");
        challenge.setContentId(contentId);
        challenge.setDurationHours(durationHours);
        challenge.setMaxSubmissions(maxSubmissions);
        challenge.setStartsAt(LocalDateTime.now());
        challenge.setEndsAt(LocalDateTime.now().plusHours(durationHours));
        challenge.setStatus("active");
        challenge.setCreatedAt(LocalDateTime.now());
        challengeMapper.insert(challenge);

        log.info("挑战已创建: groupId={}, challengeId={}, title={}, durationHours={}, maxSubmissions={}",
            groupId, challenge.getId(), title, durationHours, maxSubmissions);
        return toChallengeVO(challenge, userId);
    }

    @Override
    @Transactional
    public ChallengeVO submitChallengeResult(Long userId, Long challengeId, Long practiceId, double score) {
        GroupChallenge challenge = challengeMapper.selectById(challengeId);
        if (challenge == null) throw new RuntimeException("挑战不存在");
        if (!"active".equals(challenge.getStatus())) throw new RuntimeException("挑战已结束");

        // 检查提交次数上限
        int maxSubmissions = challenge.getMaxSubmissions() != null ? challenge.getMaxSubmissions() : 3;
        Long currentCount = submissionMapper.selectCount(new LambdaQueryWrapper<ChallengeSubmission>()
            .eq(ChallengeSubmission::getChallengeId, challengeId)
            .eq(ChallengeSubmission::getUserId, userId));
        if (currentCount != null && currentCount >= maxSubmissions)
            throw new RuntimeException("已达到每人最多提交次数 (" + maxSubmissions + "次)");

        // 每次 INSERT 新行，submissionNumber 递增
        ChallengeSubmission submission = new ChallengeSubmission();
        submission.setChallengeId(challengeId);
        submission.setUserId(userId);
        submission.setPracticeId(practiceId);
        submission.setScore(java.math.BigDecimal.valueOf(score));
        submission.setSubmissionNumber(currentCount != null ? currentCount.intValue() + 1 : 1);
        submission.setSubmittedAt(LocalDateTime.now());
        submissionMapper.insert(submission);

        log.info("挑战提交: challengeId={}, userId={}, score={}, submissionNumber={}",
            challengeId, userId, score, submission.getSubmissionNumber());
        return toChallengeVO(challenge, userId);
    }

    // ========== 讨论 ==========

    @Override
    public List<DiscussionVO> getDiscussions(Long groupId) {
        List<GroupDiscussion> discussions = discussionMapper.selectList(
            new LambdaQueryWrapper<GroupDiscussion>()
                .eq(GroupDiscussion::getGroupId, groupId)
                .orderByDesc(GroupDiscussion::getCreatedAt));

        List<DiscussionVO> result = new ArrayList<>();
        for (GroupDiscussion d : discussions) {
            DiscussionVO vo = new DiscussionVO();
            vo.setId(d.getId());
            vo.setUserId(d.getUserId());
            vo.setContent(d.getContent());
            vo.setCreatedAt(d.getCreatedAt() != null ? d.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
            try {
                String name = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(nickname, email) FROM users WHERE id = ?",
                    String.class, d.getUserId());
                vo.setUserName(name != null ? name : "匿名");
            } catch (Exception e) {
                vo.setUserName("匿名");
            }
            result.add(vo);
        }
        return result;
    }

    @Override
    @Transactional
    public DiscussionVO postDiscussion(Long userId, Long groupId, String content) {
        if (content == null || content.trim().isEmpty()) throw new RuntimeException("内容不能为空");
        if (content.length() > 2000) throw new RuntimeException("内容不超过2000字符");

        // 敏感词检测
        String filtered = filterSensitiveWords(content.trim());
        if (filtered == null) throw new RuntimeException("内容包含违规信息，请修改后重试");

        String memberRole = getMemberRole(groupId, userId);
        if (memberRole == null) throw new RuntimeException("请先加入小组");

        GroupDiscussion discussion = new GroupDiscussion();
        discussion.setGroupId(groupId);
        discussion.setUserId(userId);
        discussion.setContent(filtered);
        discussion.setCreatedAt(LocalDateTime.now());
        discussionMapper.insert(discussion);

        log.info("小组讨论发布: groupId={}, userId={}", groupId, userId);

        DiscussionVO vo = new DiscussionVO();
        vo.setId(discussion.getId());
        vo.setUserId(userId);
        vo.setContent(discussion.getContent());
        vo.setCreatedAt(discussion.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME));
        try {
            String name = jdbcTemplate.queryForObject(
                "SELECT COALESCE(nickname, email) FROM users WHERE id = ?", String.class, userId);
            vo.setUserName(name != null ? name : "匿名");
        } catch (Exception e) {
            vo.setUserName("匿名");
        }
        return vo;
    }

    // ========== 排名 ==========

    @Override
    public List<ChallengeVO> getChallengeRanking(Long challengeId) {
        GroupChallenge challenge = challengeMapper.selectById(challengeId);
        if (challenge == null) throw new RuntimeException("挑战不存在");

        // 每人取最高分的一条提交
        List<ChallengeSubmission> submissions = submissionMapper.selectList(
            new LambdaQueryWrapper<ChallengeSubmission>()
                .eq(ChallengeSubmission::getChallengeId, challengeId)
                .orderByDesc(ChallengeSubmission::getScore));

        // 去重：每人只保留最高分
        java.util.Map<Long, ChallengeSubmission> bestMap = new java.util.LinkedHashMap<>();
        for (ChallengeSubmission s : submissions) {
            bestMap.merge(s.getUserId(), s,
                (old, neu) -> (old.getScore() != null && neu.getScore() != null
                    && old.getScore().compareTo(neu.getScore()) >= 0) ? old : neu);
        }

        List<ChallengeSubmission> bestList = new ArrayList<>(bestMap.values());
        bestList.sort((a, b) -> {
            double sa = a.getScore() != null ? a.getScore().doubleValue() : 0;
            double sb = b.getScore() != null ? b.getScore().doubleValue() : 0;
            return Double.compare(sb, sa);
        });

        List<ChallengeVO> ranking = new ArrayList<>();
        int rank = 0;
        for (ChallengeSubmission s : bestList) {
            ChallengeVO vo = new ChallengeVO();
            vo.setId(s.getId());
            vo.setUserBestScore(s.getScore() != null ? s.getScore().doubleValue() : 0);
            vo.setMyRank(++rank);

            String rawName = null;
            try {
                rawName = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(nickname, email) FROM users WHERE id = ?", String.class, s.getUserId());
            } catch (Exception ignored) {}
            if (rawName == null) rawName = "匿名用户";

            // 匿名昵称：首字符+"***"+尾字符，前三名额外标注
            String displayName = anonymizeName(rawName, rank);
            vo.setContentText(displayName);
            vo.setBestSubmissionName(displayName);

            ranking.add(vo);
        }
        return ranking;
    }

    // ====== 私有方法 ======

    /** 直接加入小组（不区分 public/private） */
    private void directJoinGroup(Long userId, StudyGroup group) {
        Long groupId = group.getId();

        // 检查是否已是成员
        Long alreadyMember = memberMapper.selectCount(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));
        if (alreadyMember != null && alreadyMember > 0) return;

        // 检查小组人数上限
        int currentCount = group.getMemberCount() != null ? group.getMemberCount() : 0;
        if (currentCount >= 50) throw new RuntimeException("小组已满（上限50人）");

        // 检查用户加入小组数上限
        Long userGroupCount = memberMapper.selectCount(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getUserId, userId));
        if (userGroupCount != null && userGroupCount >= 5) throw new RuntimeException("最多加入5个小组");

        GroupMember member = new GroupMember();
        member.setGroupId(groupId);
        member.setUserId(userId);
        member.setRole("member");
        member.setJoinedAt(LocalDateTime.now());
        memberMapper.insert(member);

        group.setMemberCount(currentCount + 1);
        groupMapper.updateById(group);

        log.info("用户加入小组: userId={}, groupId={}", userId, groupId);
    }

    private ChallengeVO toChallengeVO(GroupChallenge c, Long userId) {
        ChallengeVO vo = new ChallengeVO();
        vo.setId(c.getId());
        vo.setTitle(c.getTitle());
        vo.setDescription(c.getDescription());
        vo.setContentId(c.getContentId() != null ? c.getContentId() : 0);
        vo.setDurationHours(c.getDurationHours() != null ? c.getDurationHours() : 168);
        vo.setMaxSubmissions(c.getMaxSubmissions() != null ? c.getMaxSubmissions() : 3);
        vo.setStatus(c.getStatus());
        vo.setStartsAt(c.getStartsAt() != null ? c.getStartsAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
        vo.setEndsAt(c.getEndsAt() != null ? c.getEndsAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);

        // 统计参与人数（去重用户数）
        List<ChallengeSubmission> allSubs = submissionMapper.selectList(
            new LambdaQueryWrapper<ChallengeSubmission>()
                .eq(ChallengeSubmission::getChallengeId, c.getId()));
        long participantCount = allSubs.stream().map(ChallengeSubmission::getUserId).distinct().count();
        vo.setParticipantCount((int) participantCount);
        vo.setSubmissionCount(allSubs.size());

        // 查询当前用户的提交情况
        if (userId != null) {
            List<ChallengeSubmission> mySubs = submissionMapper.selectList(
                new LambdaQueryWrapper<ChallengeSubmission>()
                    .eq(ChallengeSubmission::getChallengeId, c.getId())
                    .eq(ChallengeSubmission::getUserId, userId));

            vo.setUserSubmitted(!mySubs.isEmpty());
            vo.setUserSubmissionCount(mySubs.size());

            // 取当前用户最高分
            ChallengeSubmission bestSub = mySubs.stream()
                .filter(s -> s.getScore() != null)
                .max((a, b) -> a.getScore().compareTo(b.getScore()))
                .orElse(null);
            vo.setUserBestScore(bestSub != null && bestSub.getScore() != null
                ? bestSub.getScore().doubleValue() : null);
            vo.setMyBestScore(vo.getUserBestScore());

            // 计算排名（基于最高分）
            if (bestSub != null && bestSub.getScore() != null) {
                try {
                    // 取所有用户最高分，计算排名
                    Long rank = jdbcTemplate.queryForObject(
                        "SELECT COUNT(DISTINCT cs2.user_id) + 1 FROM (" +
                        "  SELECT user_id, MAX(score) AS max_score FROM challenge_submissions " +
                        "  WHERE challenge_id = ? GROUP BY user_id" +
                        ") cs2 WHERE cs2.max_score > ?",
                        Long.class, c.getId(), bestSub.getScore());
                    vo.setMyRank(rank != null ? rank.intValue() : null);
                } catch (Exception ignored) {}
            }
        }

        // 查询跟读内容文本
        if (c.getContentId() != null) {
            try {
                String text = jdbcTemplate.queryForObject(
                    "SELECT sentence FROM content_sentences WHERE id = ?", String.class, c.getContentId());
                vo.setContentText(text);
            } catch (Exception ignored) {}
        }

        return vo;
    }

    /**
     * 查询用户在小组成员中的角色（三层回退）。
     * MyBatis-Plus → JdbcTemplate → ownerId fallback
     * @return 角色字符串 (owner/admin/member) 或 null 表示非成员
     */
    private String getMemberRole(Long groupId, Long userId) {
        // 1. MyBatis-Plus
        GroupMember member = memberMapper.selectOne(new LambdaQueryWrapper<GroupMember>()
            .eq(GroupMember::getGroupId, groupId)
            .eq(GroupMember::getUserId, userId));
        if (member != null) return member.getRole();

        // 2. JdbcTemplate 直接 SQL
        try {
            String role = jdbcTemplate.queryForObject(
                "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?",
                String.class, groupId, userId);
            if (role != null) return role;
        } catch (Exception ignored) {}

        // 3. 检查是否为小组 owner
        StudyGroup group = groupMapper.selectById(groupId);
        if (group != null && group.getOwnerId().equals(userId)) return "owner";

        return null;
    }

    /** 敏感词检测：返回过滤后内容，命中敏感词返回 null */
    private String filterSensitiveWords(String content) {
        if (content == null) return null;
        // 敏感词列表（可扩展为数据库或配置驱动）
        String[] sensitiveWords = {
            "赌博", "博彩", "色情", "毒品", "枪支", "暴力", "诈骗",
            "fuck", "shit", "damn",
        };
        String lower = content.toLowerCase();
        for (String word : sensitiveWords) {
            if (lower.contains(word.toLowerCase())) return null;
        }
        // HTML/脚本注入防护
        if (lower.contains("<script") || lower.contains("javascript:")) return null;
        // 限制连续重复字符（防刷屏）
        if (content.matches(".*(.)\\1{9,}.*")) return null;
        return content;
    }

    /** 匿名化昵称：首字符+"***"+尾字符 */
    private String anonymizeName(String name, int rank) {
        if (name == null || name.length() <= 1) return name + "***";
        String prefix;
        if (rank <= 3) {
            String medal = rank == 1 ? "🥇" : rank == 2 ? "🥈" : "🥉";
            prefix = medal + " ";
        } else {
            prefix = "";
        }
        if (name.length() == 1) return prefix + name + "***";
        if (name.length() == 2) return prefix + name.charAt(0) + "***" + name.charAt(1);
        return prefix + name.charAt(0) + "***" + name.charAt(name.length() - 1);
    }
}
