package com.es.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.admin.entity.Assignment;
import com.es.admin.entity.AssignmentSubmission;
import com.es.admin.entity.ClassInfo;
import com.es.admin.entity.ClassStudent;
import com.es.admin.mapper.AssignmentMapper;
import com.es.admin.mapper.AssignmentSubmissionMapper;
import com.es.admin.mapper.ClassMapper;
import com.es.admin.mapper.ClassStudentMapper;
import com.es.admin.service.ReportService;
import com.es.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ReportServiceImpl implements ReportService {

    private final ClassMapper classMapper;
    private final ClassStudentMapper classStudentMapper;
    private final AssignmentMapper assignmentMapper;
    private final AssignmentSubmissionMapper submissionMapper;

    public ReportServiceImpl(ClassMapper classMapper,
                             ClassStudentMapper classStudentMapper,
                             AssignmentMapper assignmentMapper,
                             AssignmentSubmissionMapper submissionMapper) {
        this.classMapper = classMapper;
        this.classStudentMapper = classStudentMapper;
        this.assignmentMapper = assignmentMapper;
        this.submissionMapper = submissionMapper;
    }

    @Override
    public Map<String, Object> getClassOverview(Long classId, Long teacherId) {
        ClassInfo classInfo = classMapper.selectById(classId);
        if (classInfo == null || !classInfo.getTeacherId().equals(teacherId)) {
            throw new BusinessException(403, "无权查看此班级");
        }

        // 学生数
        LambdaQueryWrapper<ClassStudent> studentWrapper = new LambdaQueryWrapper<>();
        studentWrapper.eq(ClassStudent::getClassId, classId);
        long studentCount = classStudentMapper.selectCount(studentWrapper);

        // 作业数
        LambdaQueryWrapper<Assignment> assignWrapper = new LambdaQueryWrapper<>();
        assignWrapper.eq(Assignment::getClassId, classId);
        List<Assignment> assignments = assignmentMapper.selectList(assignWrapper);

        // 提交和完成统计
        long totalSubmissions = 0;
        long totalReviewed = 0;
        double totalScore = 0;
        long scoreCount = 0;

        for (Assignment a : assignments) {
            LambdaQueryWrapper<AssignmentSubmission> subWrapper = new LambdaQueryWrapper<>();
            subWrapper.eq(AssignmentSubmission::getAssignmentId, a.getId());
            List<AssignmentSubmission> subs = submissionMapper.selectList(subWrapper);
            totalSubmissions += subs.size();
            totalReviewed += subs.stream().filter(s -> "REVIEWED".equals(s.getStatus())).count();
            for (AssignmentSubmission s : subs) {
                if (s.getScore() != null) {
                    totalScore += s.getScore().doubleValue();
                    scoreCount++;
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("className", classInfo.getName());
        result.put("studentCount", studentCount);
        result.put("assignmentCount", assignments.size());
        result.put("totalSubmissions", totalSubmissions);
        result.put("totalReviewed", totalReviewed);
        result.put("completionRate", studentCount > 0 && assignments.size() > 0
                ? Math.round((double) totalSubmissions / (studentCount * assignments.size()) * 100)
                : 0);
        result.put("averageScore", scoreCount > 0 ? Math.round(totalScore / scoreCount * 100.0) / 100.0 : 0);
        return result;
    }

    @Override
    public Map<String, Object> getStudentReport(Long studentId, Long teacherId) {
        // 查找该教师所有班级中有该学生的
        LambdaQueryWrapper<ClassInfo> classWrapper = new LambdaQueryWrapper<>();
        classWrapper.eq(ClassInfo::getTeacherId, teacherId);
        List<ClassInfo> classes = classMapper.selectList(classWrapper);

        List<Long> classIds = classes.stream().map(ClassInfo::getId).toList();
        if (classIds.isEmpty()) {
            return Map.of("message", "无班级数据");
        }

        LambdaQueryWrapper<ClassStudent> csWrapper = new LambdaQueryWrapper<>();
        csWrapper.in(ClassStudent::getClassId, classIds)
                .eq(ClassStudent::getStudentId, studentId);
        if (classStudentMapper.selectCount(csWrapper) == 0) {
            throw new BusinessException(403, "该学生不在您管理的班级中");
        }

        // 该学生的所有作业提交
        LambdaQueryWrapper<AssignmentSubmission> subWrapper = new LambdaQueryWrapper<>();
        subWrapper.eq(AssignmentSubmission::getStudentId, studentId);
        List<AssignmentSubmission> submissions = submissionMapper.selectList(subWrapper);

        double totalScore = 0;
        int scoreCount = 0;
        int reviewedCount = 0;
        for (AssignmentSubmission s : submissions) {
            if (s.getScore() != null) {
                totalScore += s.getScore().doubleValue();
                scoreCount++;
            }
            if ("REVIEWED".equals(s.getStatus())) {
                reviewedCount++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("studentId", studentId);
        result.put("totalSubmissions", submissions.size());
        result.put("reviewedCount", reviewedCount);
        result.put("averageScore", scoreCount > 0 ? Math.round(totalScore / scoreCount * 100.0) / 100.0 : 0);
        return result;
    }
}
