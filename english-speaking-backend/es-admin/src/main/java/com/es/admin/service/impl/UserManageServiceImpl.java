package com.es.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.es.admin.dto.UserSearchDTO;
import com.es.admin.entity.OperationLog;
import com.es.admin.mapper.OperationLogMapper;
import com.es.admin.service.UserManageService;
import com.es.common.exception.BusinessException;
import com.es.user.dto.UserVO;
import com.es.user.entity.User;
import com.es.user.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Slf4j
@Service
public class UserManageServiceImpl implements UserManageService {

    private final UserMapper userMapper;
    private final OperationLogMapper operationLogMapper;

    public UserManageServiceImpl(UserMapper userMapper, OperationLogMapper operationLogMapper) {
        this.userMapper = userMapper;
        this.operationLogMapper = operationLogMapper;
    }

    @Override
    public Page<UserVO> searchUsers(UserSearchDTO dto) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(dto.getKeyword())) {
            wrapper.and(w -> w
                .like(User::getEmail, dto.getKeyword())
                .or().like(User::getPhone, dto.getKeyword())
                .or().like(User::getNickname, dto.getKeyword())
            );
        }
        if (StringUtils.hasText(dto.getStatus())) {
            wrapper.eq(User::getStatus, dto.getStatus());
        }
        wrapper.orderByDesc(User::getCreatedAt);

        Page<User> page = userMapper.selectPage(
            new Page<>(dto.getPage(), dto.getSize()), wrapper
        );

        Page<UserVO> result = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        result.setRecords(page.getRecords().stream().map(this::toUserVO).toList());
        return result;
    }

    @Override
    @Transactional
    public void banUser(Long userId, String reason, Long operatorId, String ip) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        if ("banned".equals(user.getStatus())) {
            throw new BusinessException(400, "用户已被封禁");
        }
        user.setStatus("banned");
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        writeOpLog(operatorId, "BAN_USER", "USER", userId, reason, ip);
        log.info("用户已封禁: userId={}, operatorId={}", userId, operatorId);
    }

    @Override
    @Transactional
    public void unbanUser(Long userId, Long operatorId, String ip) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        if (!"banned".equals(user.getStatus())) {
            throw new BusinessException(400, "用户未被封禁");
        }
        user.setStatus("active");
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        writeOpLog(operatorId, "UNBAN_USER", "USER", userId, null, ip);
        log.info("用户已解封: userId={}, operatorId={}", userId, operatorId);
    }

    private void writeOpLog(Long operatorId, String action, String targetType,
                            Long targetId, String detail, String ip) {
        OperationLog logEntry = new OperationLog();
        logEntry.setOperatorId(operatorId);
        logEntry.setAction(action);
        logEntry.setTargetType(targetType);
        logEntry.setTargetId(targetId);
        logEntry.setDetail(detail);
        logEntry.setIp(ip);
        logEntry.setCreatedAt(LocalDateTime.now());
        operationLogMapper.insert(logEntry);
    }

    private UserVO toUserVO(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setEmail(user.getEmail());
        vo.setPhone(user.getPhone() != null && user.getPhone().length() == 11
                ? user.getPhone().substring(0, 3) + "****" + user.getPhone().substring(7)
                : user.getPhone());
        vo.setNickname(user.getNickname());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setAge(user.getAge());
        vo.setGoal(user.getGoal());
        vo.setLevel(user.getLevel());
        vo.setCefrLevel(user.getCefrLevel());
        vo.setRole(user.getRole());
        vo.setStatus(user.getStatus());
        vo.setLastLoginAt(user.getLastLoginAt());
        vo.setCreatedAt(user.getCreatedAt());
        return vo;
    }
}
