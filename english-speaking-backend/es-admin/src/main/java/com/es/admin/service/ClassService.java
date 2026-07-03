package com.es.admin.service;

import com.es.admin.dto.ClassCreateDTO;
import com.es.admin.entity.ClassInfo;
import com.es.user.dto.UserVO;

import java.util.List;

public interface ClassService {

    ClassInfo createClass(Long teacherId, ClassCreateDTO dto);

    List<ClassInfo> getMyClasses(Long teacherId);

    ClassInfo getClassDetail(Long classId, Long teacherId);

    void updateClass(Long classId, ClassCreateDTO dto, Long teacherId);

    void disbandClass(Long classId, Long teacherId);

    String regenerateCode(Long classId, Long teacherId);

    List<UserVO> getClassStudents(Long classId, Long teacherId);

    void removeStudent(Long classId, Long studentId, Long teacherId);

    void joinByInviteCode(String inviteCode, Long studentId);

    List<ClassInfo> getMyEnrolledClasses(Long studentId);
}
