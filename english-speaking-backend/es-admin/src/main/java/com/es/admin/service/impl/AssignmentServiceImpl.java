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
import com.es.user.entity.User;
import com.es.user.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public AssignmentServiceImpl(AssignmentMapper assignmentMapper,
                                  AssignmentSubmissionMapper submissionMapper,
                                  ClassMapper classMapper,
                                  ClassStudentMapper classStudentMapper,
                                  UserMapper userMapper) {
        this.assignmentMapper = assignmentMapper;
        this.submissionMapper = submissionMapper;
        this.classMapper = classMapper;
        this.classStudentMapper = classStudentMapper;
        this.userMapper = userMapper;
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
        assignment.setDeadline(dto.getDeadline());
        assignment.setPublishType(dto.getPublishType() != null ? dto.getPublishType() : "IMMEDIATE");
        assignment.setPublishAt(dto.getPublishAt());
        assignment.setStatus(dto.getPublishType() != null && "SCHEDULED".equals(dto.getPublishType())
                ? "DRAFT" : "PUBLISHED");
        assignment.setSubmitCount(0);
        assignmentMapper.insert(assignment);
        log.info("作业创建成功: assignmentId={}, teacherId={}", assignment.getId(), teacherId);
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
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) throw new BusinessException(404, "作业不存在");
        if (!"PUBLISHED".equals(assignment.getStatus()))
            throw new BusinessException(400, "作业未发布");

        // 校验学生在班级中
        LambdaQueryWrapper<ClassStudent> csWrapper = new LambdaQueryWrapper<>();
        csWrapper.eq(ClassStudent::getClassId, assignment.getClassId())
                .eq(ClassStudent::getStudentId, studentId);
        if (classStudentMapper.selectCount(csWrapper) == 0)
            throw new BusinessException(403, "你未加入此班级");

        // 检查重复提交
        LambdaQueryWrapper<AssignmentSubmission> subWrapper = new LambdaQueryWrapper<>();
        subWrapper.eq(AssignmentSubmission::getAssignmentId, assignmentId)
                .eq(AssignmentSubmission::getStudentId, studentId);
        if (submissionMapper.selectCount(subWrapper) > 0)
            throw new BusinessException(400, "你已提交过此作业");

        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setAssignmentId(assignmentId);
        submission.setStudentId(studentId);
        submission.setTextContent(text);
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        submissionMapper.insert(submission);

        assignment.setSubmitCount(assignment.getSubmitCount() + 1);
        assignmentMapper.updateById(assignment);
        log.info("作业提交成功: assignmentId={}, studentId={}", assignmentId, studentId);
    }

    @Override
    public Map<String, Object> getAssignmentReport(Long assignmentId, Long teacherId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) throw new BusinessException(404, "作业不存在");
        if (!assignment.getTeacherId().equals(teacherId))
            throw new BusinessException(403, "无权查看此作业");

        // 获取班级所有学生
        LambdaQueryWrapper<ClassStudent> csWrapper = new LambdaQueryWrapper<>();
        csWrapper.eq(ClassStudent::getClassId, assignment.getClassId());
        List<ClassStudent> enrollments = classStudentMapper.selectList(csWrapper);

        // 获取所有提交
        LambdaQueryWrapper<AssignmentSubmission> subWrapper = new LambdaQueryWrapper<>();
        subWrapper.eq(AssignmentSubmission::getAssignmentId, assignmentId);
        List<AssignmentSubmission> submissions = submissionMapper.selectList(subWrapper);
        Map<Long, AssignmentSubmission> submissionMap = submissions.stream()
                .collect(Collectors.toMap(AssignmentSubmission::getStudentId, s -> s));

        // 组装学生提交状态
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
                studentInfo.put("score", sub.getScore());
                studentInfo.put("teacherScore", sub.getTeacherScore());
                studentInfo.put("teacherReview", sub.getTeacherReview());
                studentInfo.put("status", sub.getStatus());
                studentInfo.put("submittedAt", sub.getSubmittedAt());
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
            item.put("score", sub.getScore());
            item.put("teacherReview", sub.getTeacherReview());
            item.put("teacherScore", sub.getTeacherScore());
            item.put("submittedAt", sub.getSubmittedAt());
            item.put("reviewedAt", sub.getReviewedAt());
            result.add(item);
        }
        return result;
    }
}
