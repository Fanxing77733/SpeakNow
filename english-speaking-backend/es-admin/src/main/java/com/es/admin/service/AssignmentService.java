package com.es.admin.service;

import com.es.admin.dto.AssignmentCreateDTO;
import com.es.admin.dto.ReviewSubmissionDTO;
import com.es.admin.entity.Assignment;
import com.es.admin.entity.AssignmentSubmission;

import java.util.List;
import java.util.Map;

public interface AssignmentService {

    Assignment createAssignment(Long teacherId, AssignmentCreateDTO dto);

    List<Assignment> getAssignments(Long teacherId, Long classId);

    Assignment getAssignmentDetail(Long assignmentId);

    List<AssignmentSubmission> getSubmissions(Long assignmentId, Long teacherId);

    AssignmentSubmission getSubmissionDetail(Long submissionId, Long teacherId);

    void reviewSubmission(Long submissionId, ReviewSubmissionDTO dto, Long teacherId);

    List<Assignment> getAssignmentsByClassIds(List<Long> classIds);

    void submitAssignment(Long studentId, Long assignmentId, String text);

    /** 以情景对话记录提交作业 */
    void submitConversationAssignment(Long studentId, Long assignmentId, Long sessionId);

    /** 以跟读练习记录提交作业 */
    void submitPronounceAssignment(Long studentId, Long assignmentId, Long recordId);

    Map<String, Object> getAssignmentReport(Long assignmentId, Long teacherId);

    List<Map<String, Object>> getStudentSubmissions(Long studentId);
}
