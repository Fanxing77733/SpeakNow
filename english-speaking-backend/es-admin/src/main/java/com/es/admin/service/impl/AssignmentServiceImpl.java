package com.es.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.admin.dto.AssignmentCreateDTO;
import com.es.admin.dto.ReviewSubmissionDTO;
import com.es.admin.entity.Assignment;
import com.es.admin.entity.AssignmentSubmission;
import com.es.admin.entity.ClassStudent;
import com.es.admin.mapper.AssignmentMapper;
import com.es.admin.mapper.AssignmentSubmissionMapper;
import com.es.admin.mapper.ClassMapper;
import com.es.admin.mapper.ClassStudentMapper;
import com.es.admin.service.AssignmentService;
import com.es.common.exception.BusinessException;
import com.es.practice.entity.ConversationMessage;
import com.es.practice.entity.ConversationSession;
import com.es.practice.entity.PracticeRecord;
import com.es.practice.mapper.ConversationMessageMapper;
import com.es.practice.mapper.ConversationSessionMapper;
import com.es.practice.mapper.PracticeRecordMapper;
import com.es.user.entity.User;
import com.es.user.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentMapper assignmentMapper;
    private final AssignmentSubmissionMapper submissionMapper;
    private final ClassMapper classMapper;
    private final ClassStudentMapper classStudentMapper;
    private final UserMapper userMapper;
    private final ConversationSessionMapper conversationSessionMapper;
    private final ConversationMessageMapper conversationMessageMapper;
    private final PracticeRecordMapper practiceRecordMapper;

    public AssignmentServiceImpl(AssignmentMapper assignmentMapper,
                                  AssignmentSubmissionMapper submissionMapper,
                                  ClassMapper classMapper,
                                  ClassStudentMapper classStudentMapper,
                                  UserMapper userMapper,
                                  ConversationSessionMapper conversationSessionMapper,
                                  ConversationMessageMapper conversationMessageMapper,
                                  PracticeRecordMapper practiceRecordMapper) {
        this.assignmentMapper = assignmentMapper;
        this.submissionMapper = submissionMapper;
        this.classMapper = classMapper;
        this.classStudentMapper = classStudentMapper;
        this.userMapper = userMapper;
        this.conversationSessionMapper = conversationSessionMapper;
        this.conversationMessageMapper = conversationMessageMapper;
        this.practiceRecordMapper = practiceRecordMapper;
    }

    @Override
    @Transactional
    public Assignment createAssignment(Long teacherId, AssignmentCreateDTO dto) {
        if (classMapper.selectById(dto.getClassId()) == null) {
            throw new BusinessException(404, "班级不存在");
        }

        Assignment assignment = new Assignment();
        assignment.setClassId(dto.getClassId());
        assignment.setTeacherId(teacherId);
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        assignment.setAssignmentType(dto.getAssignmentType() != null ? dto.getAssignmentType() : "PRONOUNCE");
        assignment.setContentId(dto.getContentId());
        assignment.setContentIds(dto.getContentIds());
        assignment.setSceneKey(dto.getSceneKey());
        assignment.setDifficulty(dto.getDifficulty() != null ? dto.getDifficulty() : "MEDIUM");
        assignment.setRequiredRounds(dto.getRequiredRounds() != null ? dto.getRequiredRounds() : 5);
        assignment.setDeadline(dto.getDeadline());
        assignment.setPublishType(dto.getPublishType() != null ? dto.getPublishType() : "IMMEDIATE");
        assignment.setPublishAt(dto.getPublishAt());
        assignment.setStatus(dto.getPublishType() != null && "SCHEDULED".equals(dto.getPublishType())
                ? "DRAFT" : "PUBLISHED");
        assignment.setSubmitCount(0);
        assignmentMapper.insert(assignment);
        log.info("作业创建成功: assignmentId={}, teacherId={}, type={}", assignment.getId(), teacherId, assignment.getAssignmentType());
        return assignment;
    }

    @Override
    public List<Assignment> getAssignments(Long teacherId, Long classId) {
        LambdaQueryWrapper<Assignment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Assignment::getTeacherId, teacherId);
        if (classId != null) {
            wrapper.eq(Assignment::getClassId, classId);
        }
        wrapper.orderByDesc(Assignment::getCreatedAt);
        return assignmentMapper.selectList(wrapper);
    }

    @Override
    public Assignment getAssignmentDetail(Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(404, "作业不存在");
        }
        return assignment;
    }

    @Override
    public List<AssignmentSubmission> getSubmissions(Long assignmentId, Long teacherId) {
        Assignment assignment = getAssignmentDetail(assignmentId);
        if (!assignment.getTeacherId().equals(teacherId)) {
            throw new BusinessException(403, "无权查看此作业");
        }
        LambdaQueryWrapper<AssignmentSubmission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AssignmentSubmission::getAssignmentId, assignmentId)
                .orderByDesc(AssignmentSubmission::getSubmittedAt);
        return submissionMapper.selectList(wrapper);
    }

    @Override
    public AssignmentSubmission getSubmissionDetail(Long submissionId, Long teacherId) {
        AssignmentSubmission submission = submissionMapper.selectById(submissionId);
        if (submission == null) {
            throw new BusinessException(404, "提交记录不存在");
        }
        Assignment assignment = assignmentMapper.selectById(submission.getAssignmentId());
        if (assignment == null || !assignment.getTeacherId().equals(teacherId)) {
            throw new BusinessException(403, "无权查看此提交");
        }
        return submission;
    }

    @Override
    @Transactional
    public void reviewSubmission(Long submissionId, ReviewSubmissionDTO dto, Long teacherId) {
        AssignmentSubmission submission = getSubmissionDetail(submissionId, teacherId);
        submission.setTeacherReview(dto.getTeacherReview());
        submission.setTeacherAudioUrl(dto.getTeacherAudioUrl());
        submission.setTeacherScore(dto.getTeacherScore());
        submission.setStatus("REVIEWED");
        submission.setReviewedAt(LocalDateTime.now());
        submissionMapper.updateById(submission);
        log.info("作业点评完成: submissionId={}, teacherId={}", submissionId, teacherId);
    }

    @Override
    public List<Assignment> getAssignmentsByClassIds(List<Long> classIds) {
        if (classIds == null || classIds.isEmpty()) return List.of();
        LambdaQueryWrapper<Assignment> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Assignment::getClassId, classIds)
                .eq(Assignment::getStatus, "PUBLISHED")
                .orderByDesc(Assignment::getCreatedAt);
        return assignmentMapper.selectList(wrapper);
    }

    @Override
    @Transactional
    public void submitAssignment(Long studentId, Long assignmentId, String text) {
        Assignment assignment = validateAssignmentForSubmission(studentId, assignmentId);

        AssignmentSubmission submission = upsertSubmission(studentId, assignmentId);
        submission.setTextContent(text);
        submission.setAudioUrl(null);
        submission.setPracticeRecordId(null);
        submission.setScore(null);
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        saveOrUpdateSubmission(submission, assignment);

        log.info("作业提交成功(文本): assignmentId={}, studentId={}", assignmentId, studentId);
    }

    @Override
    @Transactional
    public void submitConversationAssignment(Long studentId, Long assignmentId, Long sessionId) {
        Assignment assignment = validateAssignmentForSubmission(studentId, assignmentId);
        if (!"CONVERSATION".equals(assignment.getAssignmentType())) {
            throw new BusinessException(400, "此作业不支持对话提交，请使用文本提交");
        }

        ConversationSession session = conversationSessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException(404, "对话记录不存在");
        }
        if (!session.getUserId().equals(studentId)) {
            throw new BusinessException(403, "对话记录不属于当前用户");
        }
        if (!"completed".equals(session.getStatus())) {
            throw new BusinessException(400, "对话尚未完成，请先完成对话再提交");
        }

        // 校验场景一致性（如果作业指定了场景）
        if (assignment.getContentId() != null
                && !assignment.getContentId().equals(session.getRoleplaySceneId())) {
            throw new BusinessException(400, "对话场景与作业要求不一致");
        }

        // 拼接对话文本
        LambdaQueryWrapper<ConversationMessage> msgWrapper = new LambdaQueryWrapper<>();
        msgWrapper.eq(ConversationMessage::getSessionId, sessionId)
                .orderByAsc(ConversationMessage::getRound, ConversationMessage::getId);
        List<ConversationMessage> messages = conversationMessageMapper.selectList(msgWrapper);
        StringBuilder transcript = new StringBuilder();
        for (ConversationMessage msg : messages) {
            transcript.append(msg.getRole().equals("ai") ? "AI: " : "学生: ")
                    .append(msg.getContent())
                    .append("\n");
        }

        AssignmentSubmission submission = upsertSubmission(studentId, assignmentId);
        submission.setPracticeRecordId(session.getId());
        submission.setScore(session.getTotalScore() != null ? session.getTotalScore() : null);
        submission.setTextContent(transcript.toString());
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        saveOrUpdateSubmission(submission, assignment);

        log.info("作业提交成功(对话): assignmentId={}, studentId={}, sessionId={}", assignmentId, studentId, sessionId);
    }

    @Override
    @Transactional
    public void submitPronounceAssignment(Long studentId, Long assignmentId, Long recordId) {
        Assignment assignment = validateAssignmentForSubmission(studentId, assignmentId);
        if (!"PRONOUNCE".equals(assignment.getAssignmentType())) {
            throw new BusinessException(400, "此作业不支持跟读提交，请使用文本提交");
        }

        PracticeRecord record = practiceRecordMapper.selectById(recordId);
        if (record == null) {
            throw new BusinessException(404, "练习记录不存在");
        }
        if (!record.getUserId().equals(studentId)) {
            throw new BusinessException(403, "练习记录不属于当前用户");
        }
        if (!"completed".equals(record.getStatus())) {
            throw new BusinessException(400, "练习尚未完成，请先完成练习再提交");
        }

        // 校验内容一致性（如果作业指定了跟读内容）
        if (assignment.getContentId() != null
                && !assignment.getContentId().equals(record.getContentId().longValue())) {
            throw new BusinessException(400, "练习内容与作业要求不一致");
        }
        // 也检查 contentIds 多句列表
        if (assignment.getContentIds() != null && !assignment.getContentIds().isEmpty()) {
            List<String> ids = Arrays.asList(assignment.getContentIds().split(","));
            if (!ids.contains(String.valueOf(record.getContentId()))) {
                throw new BusinessException(400, "练习内容不在作业指定的句子列表中");
            }
        }

        AssignmentSubmission submission = upsertSubmission(studentId, assignmentId);
        submission.setPracticeRecordId(record.getId());
        submission.setAudioUrl(record.getAudioUrl());
        submission.setScore(record.getTotalScore() != null ? record.getTotalScore() : null);
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        saveOrUpdateSubmission(submission, assignment);

        log.info("作业提交成功(跟读): assignmentId={}, studentId={}, recordId={}", assignmentId, studentId, recordId);
    }

    @Override
    public Map<String, Object> getAssignmentReport(Long assignmentId, Long teacherId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) throw new BusinessException(404, "作业不存在");
        if (!assignment.getTeacherId().equals(teacherId))
            throw new BusinessException(403, "无权查看此作业");

        LambdaQueryWrapper<ClassStudent> csWrapper = new LambdaQueryWrapper<>();
        csWrapper.eq(ClassStudent::getClassId, assignment.getClassId());
        List<ClassStudent> enrollments = classStudentMapper.selectList(csWrapper);

        LambdaQueryWrapper<AssignmentSubmission> subWrapper = new LambdaQueryWrapper<>();
        subWrapper.eq(AssignmentSubmission::getAssignmentId, assignmentId);
        List<AssignmentSubmission> submissions = submissionMapper.selectList(subWrapper);
        Map<Long, AssignmentSubmission> submissionMap = submissions.stream()
                .collect(Collectors.toMap(AssignmentSubmission::getStudentId, s -> s));

        List<Map<String, Object>> students = new ArrayList<>();
        for (ClassStudent cs : enrollments) {
            User user = userMapper.selectById(cs.getStudentId());
            AssignmentSubmission sub = submissionMap.get(cs.getStudentId());

            Map<String, Object> studentInfo = new HashMap<>();
            studentInfo.put("studentId", cs.getStudentId());
            studentInfo.put("nickname", user != null ? user.getNickname() : "未知");
            studentInfo.put("email", user != null ? user.getEmail() : "");
            studentInfo.put("submitted", sub != null);
            if (sub != null) {
                studentInfo.put("submissionId", sub.getId());
                studentInfo.put("content", sub.getTextContent());
                studentInfo.put("audioUrl", sub.getAudioUrl());
                studentInfo.put("score", sub.getScore());
                studentInfo.put("teacherScore", sub.getTeacherScore());
                studentInfo.put("teacherReview", sub.getTeacherReview());
                studentInfo.put("status", sub.getStatus());
                studentInfo.put("submittedAt", sub.getSubmittedAt());
                studentInfo.put("practiceRecordId", sub.getPracticeRecordId());

                // 对话类型：附带逐轮消息
                if ("CONVERSATION".equals(assignment.getAssignmentType()) && sub.getPracticeRecordId() != null) {
                    studentInfo.put("conversationMessages", loadConversationMessages(sub.getPracticeRecordId()));
                }

                // 跟读类型：附带评测详情
                if ("PRONOUNCE".equals(assignment.getAssignmentType()) && sub.getPracticeRecordId() != null) {
                    PracticeRecord pr = practiceRecordMapper.selectById(sub.getPracticeRecordId());
                    if (pr != null) {
                        Map<String, Object> evalDetail = new HashMap<>();
                        evalDetail.put("accuracyScore", pr.getAccuracyScore());
                        evalDetail.put("fluencyScore", pr.getFluencyScore());
                        evalDetail.put("completenessScore", pr.getCompletenessScore());
                        evalDetail.put("stressScore", pr.getStressScore());
                        evalDetail.put("intonationScore", pr.getIntonationScore());
                        evalDetail.put("durationSeconds", pr.getDurationSeconds());
                        evalDetail.put("evalDetailJson", pr.getEvalDetailJson());
                        studentInfo.put("pronounceDetail", evalDetail);
                    }
                }
            }

            students.add(studentInfo);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("assignment", assignment);
        result.put("students", students);
        result.put("submittedCount", submissions.size());
        result.put("totalStudents", enrollments.size());
        return result;
    }

    @Override
    public List<Map<String, Object>> getStudentSubmissions(Long studentId) {
        LambdaQueryWrapper<AssignmentSubmission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AssignmentSubmission::getStudentId, studentId)
                .orderByDesc(AssignmentSubmission::getSubmittedAt);
        List<AssignmentSubmission> submissions = submissionMapper.selectList(wrapper);

        List<Map<String, Object>> result = new ArrayList<>();
        for (AssignmentSubmission sub : submissions) {
            Assignment assignment = assignmentMapper.selectById(sub.getAssignmentId());
            if (assignment == null) continue;

            Map<String, Object> item = new HashMap<>();
            item.put("submissionId", sub.getId());
            item.put("assignmentId", assignment.getId());
            item.put("assignmentTitle", assignment.getTitle());
            item.put("assignmentType", assignment.getAssignmentType());
            item.put("status", sub.getStatus());
            item.put("content", sub.getTextContent());
            item.put("audioUrl", sub.getAudioUrl());
            item.put("score", sub.getScore());
            item.put("teacherReview", sub.getTeacherReview());
            item.put("teacherScore", sub.getTeacherScore());
            item.put("submittedAt", sub.getSubmittedAt());
            item.put("reviewedAt", sub.getReviewedAt());
            item.put("practiceRecordId", sub.getPracticeRecordId());
            result.add(item);
        }
        return result;
    }

    // ==================== 私有辅助方法 ====================

    /** 校验作业可提交性 + 学生在班级中 */
    private Assignment validateAssignmentForSubmission(Long studentId, Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) throw new BusinessException(404, "作业不存在");
        if (!"PUBLISHED".equals(assignment.getStatus()))
            throw new BusinessException(400, "作业未发布");
        if (assignment.getDeadline() != null && assignment.getDeadline().isBefore(LocalDateTime.now()))
            throw new BusinessException(400, "作业已截止");

        LambdaQueryWrapper<ClassStudent> csWrapper = new LambdaQueryWrapper<>();
        csWrapper.eq(ClassStudent::getClassId, assignment.getClassId())
                .eq(ClassStudent::getStudentId, studentId);
        if (classStudentMapper.selectCount(csWrapper) == 0)
            throw new BusinessException(403, "你未加入此班级");

        return assignment;
    }

    /** 查找已有提交记录，或创建新记录（不 insert） */
    private AssignmentSubmission upsertSubmission(Long studentId, Long assignmentId) {
        LambdaQueryWrapper<AssignmentSubmission> subWrapper = new LambdaQueryWrapper<>();
        subWrapper.eq(AssignmentSubmission::getAssignmentId, assignmentId)
                .eq(AssignmentSubmission::getStudentId, studentId);
        AssignmentSubmission existing = submissionMapper.selectOne(subWrapper);
        if (existing != null) return existing;
        AssignmentSubmission sub = new AssignmentSubmission();
        sub.setStudentId(studentId);
        sub.setAssignmentId(assignmentId);
        return sub;
    }

    /** 插入或更新提交记录，首次提交递增 submit_count */
    private void saveOrUpdateSubmission(AssignmentSubmission submission, Assignment assignment) {
        if (submission.getId() == null) {
            submissionMapper.insert(submission);
            assignment.setSubmitCount(assignment.getSubmitCount() + 1);
            assignmentMapper.updateById(assignment);
        } else {
            submissionMapper.updateById(submission);
        }
    }

    /** 加载对话逐轮消息 */
    private List<Map<String, Object>> loadConversationMessages(Long sessionId) {
        LambdaQueryWrapper<ConversationMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ConversationMessage::getSessionId, sessionId)
                .orderByAsc(ConversationMessage::getRound, ConversationMessage::getId);
        List<ConversationMessage> messages = conversationMessageMapper.selectList(wrapper);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ConversationMessage msg : messages) {
            Map<String, Object> m = new HashMap<>();
            m.put("round", msg.getRound());
            m.put("role", msg.getRole());
            m.put("content", msg.getContent());
            m.put("audioUrl", msg.getAudioUrl());
            result.add(m);
        }
        return result;
    }
}
