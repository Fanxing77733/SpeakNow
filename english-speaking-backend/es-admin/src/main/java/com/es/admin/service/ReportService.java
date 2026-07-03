package com.es.admin.service;

import java.util.Map;

public interface ReportService {

    Map<String, Object> getClassOverview(Long classId, Long teacherId);

    Map<String, Object> getStudentReport(Long studentId, Long teacherId);
}
