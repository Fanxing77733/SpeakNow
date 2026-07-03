package com.es.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.admin.dto.ClassCreateDTO;
import com.es.admin.entity.ClassInfo;
import com.es.admin.entity.ClassStudent;
import com.es.admin.mapper.ClassMapper;
import com.es.admin.mapper.ClassStudentMapper;
import com.es.admin.service.ClassService;
import com.es.common.exception.BusinessException;
import com.es.user.dto.UserVO;
import com.es.user.entity.User;
import com.es.user.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ClassServiceImpl implements ClassService {

    private final ClassMapper classMapper;
    private final ClassStudentMapper classStudentMapper;
    private final UserMapper userMapper;

    public ClassServiceImpl(ClassMapper classMapper,
                            ClassStudentMapper classStudentMapper,
                            UserMapper userMapper) {
        this.classMapper = classMapper;
        this.classStudentMapper = classStudentMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public ClassInfo createClass(Long teacherId, ClassCreateDTO dto) {
        ClassInfo classInfo = new ClassInfo();
        classInfo.setTeacherId(teacherId);
        classInfo.setName(dto.getName());
        classInfo.setDescription(dto.getDescription());
        classInfo.setInviteCode(generateInviteCode());
        classInfo.setStudentCount(0);
        classInfo.setMaxStudents(200);
        classInfo.setStatus("ACTIVE");
        classMapper.insert(classInfo);
        log.info("班级创建成功: classId={}, teacherId={}", classInfo.getId(), teacherId);
        return classInfo;
    }

    @Override
    public List<ClassInfo> getMyClasses(Long teacherId) {
        LambdaQueryWrapper<ClassInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClassInfo::getTeacherId, teacherId)
                .eq(ClassInfo::getStatus, "ACTIVE")
                .orderByDesc(ClassInfo::getCreatedAt);
        return classMapper.selectList(wrapper);
    }

    @Override
    public ClassInfo getClassDetail(Long classId, Long teacherId) {
        ClassInfo classInfo = classMapper.selectById(classId);
        if (classInfo == null) {
            throw new BusinessException(404, "班级不存在");
        }
        if (!classInfo.getTeacherId().equals(teacherId)) {
            throw new BusinessException(403, "无权查看此班级");
        }
        return classInfo;
    }

    @Override
    @Transactional
    public void updateClass(Long classId, ClassCreateDTO dto, Long teacherId) {
        ClassInfo classInfo = getClassDetail(classId, teacherId);
        classInfo.setName(dto.getName());
        classInfo.setDescription(dto.getDescription());
        classMapper.updateById(classInfo);
    }

    @Override
    @Transactional
    public void disbandClass(Long classId, Long teacherId) {
        ClassInfo classInfo = getClassDetail(classId, teacherId);
        classInfo.setStatus("DISBANDED");
        classMapper.updateById(classInfo);
        log.info("班级已解散: classId={}, teacherId={}", classId, teacherId);
    }

    @Override
    @Transactional
    public String regenerateCode(Long classId, Long teacherId) {
        ClassInfo classInfo = getClassDetail(classId, teacherId);
        String newCode = generateInviteCode();
        classInfo.setInviteCode(newCode);
        classMapper.updateById(classInfo);
        log.info("邀请码已重新生成: classId={}", classId);
        return newCode;
    }

    @Override
    public List<UserVO> getClassStudents(Long classId, Long teacherId) {
        getClassDetail(classId, teacherId); // 权限校验

        LambdaQueryWrapper<ClassStudent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClassStudent::getClassId, classId);
        List<ClassStudent> students = classStudentMapper.selectList(wrapper);

        return students.stream().map(cs -> {
            User user = userMapper.selectById(cs.getStudentId());
            return toUserVO(user);
        }).toList();
    }

    @Override
    @Transactional
    public void removeStudent(Long classId, Long studentId, Long teacherId) {
        getClassDetail(classId, teacherId); // 权限校验

        LambdaQueryWrapper<ClassStudent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClassStudent::getClassId, classId)
                .eq(ClassStudent::getStudentId, studentId);
        classStudentMapper.delete(wrapper);

        ClassInfo classInfo = classMapper.selectById(classId);
        classInfo.setStudentCount(Math.max(0, classInfo.getStudentCount() - 1));
        classMapper.updateById(classInfo);
        log.info("学生已移出班级: classId={}, studentId={}", classId, studentId);
    }

    @Override
    @Transactional
    public void joinByInviteCode(String inviteCode, Long studentId) {
        LambdaQueryWrapper<ClassInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClassInfo::getInviteCode, inviteCode)
                .eq(ClassInfo::getStatus, "ACTIVE");
        ClassInfo classInfo = classMapper.selectOne(wrapper);
        if (classInfo == null) {
            throw new BusinessException(400, "邀请码无效或班级已解散");
        }

        if (classInfo.getStudentCount() >= classInfo.getMaxStudents()) {
            throw new BusinessException(400, "班级已满，无法加入");
        }

        LambdaQueryWrapper<ClassStudent> existWrapper = new LambdaQueryWrapper<>();
        existWrapper.eq(ClassStudent::getClassId, classInfo.getId())
                .eq(ClassStudent::getStudentId, studentId);
        if (classStudentMapper.selectCount(existWrapper) > 0) {
            throw new BusinessException(400, "你已加入该班级");
        }

        ClassStudent cs = new ClassStudent();
        cs.setClassId(classInfo.getId());
        cs.setStudentId(studentId);
        classStudentMapper.insert(cs);

        classInfo.setStudentCount(classInfo.getStudentCount() + 1);
        classMapper.updateById(classInfo);
        log.info("学生加入班级: classId={}, studentId={}", classInfo.getId(), studentId);
    }

    @Override
    public List<ClassInfo> getMyEnrolledClasses(Long studentId) {
        LambdaQueryWrapper<ClassStudent> csWrapper = new LambdaQueryWrapper<>();
        csWrapper.eq(ClassStudent::getStudentId, studentId);
        List<ClassStudent> enrollments = classStudentMapper.selectList(csWrapper);

        if (enrollments.isEmpty()) return List.of();

        List<Long> classIds = enrollments.stream().map(ClassStudent::getClassId).toList();
        return classMapper.selectBatchIds(classIds).stream()
                .filter(c -> "ACTIVE".equals(c.getStatus()))
                .toList();
    }

    private String generateInviteCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private UserVO toUserVO(User user) {
        if (user == null) return null;
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setNickname(user.getNickname());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setEmail(user.getEmail());
        vo.setLevel(user.getLevel());
        vo.setCefrLevel(user.getCefrLevel());
        return vo;
    }
}
