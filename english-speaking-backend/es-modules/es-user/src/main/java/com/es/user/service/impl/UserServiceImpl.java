package com.es.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.exception.BusinessException;
import com.es.security.util.JwtUtil;
import com.es.user.dto.*;
import com.es.user.entity.User;
import com.es.user.mapper.UserMapper;
import com.es.user.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

/**
 * 用户中心业务逻辑实现
 */
@Slf4j
@Service
public class UserServiceImpl implements UserService {

    private static final int REGISTER_RATE_LIMIT = 3;
    private static final int LOGIN_RATE_LIMIT = 10;
    private static final int MAX_LOGIN_ERRORS = 5;
    private static final int LOCK_DURATION_SECONDS = 1800; // 30分钟
    private static final int RATE_LIMIT_WINDOW_SECONDS = 60; // 60秒窗口

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;

    public UserServiceImpl(UserMapper userMapper,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           StringRedisTemplate redisTemplate) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.redisTemplate = redisTemplate;
    }

    @Override
    @Transactional
    public LoginResult register(RegisterDTO dto, String ip) {
        // 1. IP 限流检查
        String rateKey = "register:rate:" + ip;
        Long rateCount = redisTemplate.opsForValue().increment(rateKey);
        if (rateCount != null && rateCount == 1) {
            redisTemplate.expire(rateKey, RATE_LIMIT_WINDOW_SECONDS, TimeUnit.SECONDS);
        }
        if (rateCount != null && rateCount > REGISTER_RATE_LIMIT) {
            log.warn("注册IP限流触发: ip={}, count={}", ip, rateCount);
            throw new BusinessException(429, "操作过于频繁，请稍后再试");
        }

        // 2. 唯一性检查
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            wrapper = wrapper.eq(User::getEmail, dto.getEmail());
        }
        if (dto.getPhone() != null && !dto.getPhone().isEmpty()) {
            wrapper = wrapper.or().eq(User::getPhone, dto.getPhone());
        }
        if (userMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(409, "该邮箱或手机号已注册，请直接登录");
        }

        // 3. BCrypt 加密密码 strength=12
        String encodedPassword = passwordEncoder.encode(dto.getPassword());

        // 4. 插入用户
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPasswordHash(encodedPassword);
        user.setNickname(generateDefaultNickname(dto.getEmail(), dto.getPhone()));
        user.setAge(dto.getAge());
        user.setGoal(dto.getGoal());
        user.setStatus("active");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(user);
        log.info("用户注册成功: userId={}, email={}, phone={}", user.getId(), dto.getEmail(), dto.getPhone());

        // 5. 生成 JWT
        String token = jwtUtil.generateToken(user.getId());

        // 6. 返回 LoginResult
        UserVO userVO = toUserVO(user);
        return new LoginResult(token, userVO);
    }

    @Override
    @Transactional
    public LoginResult login(LoginDTO dto, String ip) {
        // 1. IP 限流检查
        String rateKey = "login:rate:" + ip;
        Long rateCount = redisTemplate.opsForValue().increment(rateKey);
        if (rateCount != null && rateCount == 1) {
            redisTemplate.expire(rateKey, RATE_LIMIT_WINDOW_SECONDS, TimeUnit.SECONDS);
        }
        if (rateCount != null && rateCount > LOGIN_RATE_LIMIT) {
            log.warn("登录IP限流触发: ip={}, count={}", ip, rateCount);
            throw new BusinessException(429, "操作过于频繁，请稍后再试");
        }

        // 2. 查询账号（支持邮箱或手机号登录）
        User user = findByAccount(dto.getAccount());
        if (user == null) {
            throw new BusinessException(404, "账号不存在，请先注册");
        }

        // 3. 检查账号锁定状态
        String lockKey = "login:lock:" + user.getId();
        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
            throw new BusinessException(403, "账号已被临时锁定，请30分钟后再试");
        }

        // 4. 密码验证
        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            // 密码错误：记录错误次数
            String errorKey = "login:error:" + user.getId();
            Long errorCount = redisTemplate.opsForValue().increment(errorKey);
            if (errorCount != null && errorCount == 1) {
                redisTemplate.expire(errorKey, LOCK_DURATION_SECONDS, TimeUnit.SECONDS);
            }

            int remaining = MAX_LOGIN_ERRORS - (errorCount != null ? errorCount.intValue() : 1);
            if (remaining <= 0) {
                // 达到最大错误次数，锁定账号
                redisTemplate.opsForValue().set(lockKey, "1", LOCK_DURATION_SECONDS, TimeUnit.SECONDS);
                redisTemplate.delete(errorKey);
                log.warn("账号已被锁定: userId={}", user.getId());
                throw new BusinessException(403, "账号已被临时锁定，请30分钟后再试");
            }

            log.warn("密码错误: userId={}, remaining={}", user.getId(), remaining);
            throw new BusinessException(401, "密码错误，请重试（剩余" + remaining + "次）");
        }

        // 5. 密码匹配成功：清除错误计数
        String errorKey = "login:error:" + user.getId();
        redisTemplate.delete(errorKey);

        // 6. 生成 JWT
        String token = jwtUtil.generateToken(user.getId());

        // 7. 更新最近登录信息
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(ip);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        log.info("用户登录成功: userId={}", user.getId());

        UserVO userVO = toUserVO(user);
        return new LoginResult(token, userVO);
    }

    @Override
    public UserVO getProfile(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return toUserVO(user);
    }

    @Override
    @Transactional
    public UpdateProfileResult updateProfile(Long userId, ProfileDTO dto) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        boolean targetChanged = false;

        if (dto.getAge() != null && !dto.getAge().equals(user.getAge())) {
            user.setAge(dto.getAge());
            targetChanged = true;
        }
        if (dto.getGoal() != null && !dto.getGoal().equals(user.getGoal())) {
            user.setGoal(dto.getGoal());
            targetChanged = true;
        }
        if (dto.getNickname() != null && !dto.getNickname().isEmpty()) {
            user.setNickname(dto.getNickname());
        }

        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        log.info("用户资料更新: userId={}, targetChanged={}", userId, targetChanged);

        UserVO userVO = toUserVO(user);
        return new UpdateProfileResult(userVO, targetChanged);
    }

    @Override
    public void updateLevel(Long userId, String level) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        user.setLevel(level);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        log.info("用户水平等级更新: userId={}, level={}", userId, level);
    }

    // ======================== 私有方法 ========================

    /** 根据邮箱或手机号查找用户 */
    private User findByAccount(String account) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, account).or().eq(User::getPhone, account);
        return userMapper.selectOne(wrapper);
    }

    /** 用户实体 -> UserVO，手机号脱敏 */
    private UserVO toUserVO(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setEmail(user.getEmail());
        vo.setPhone(desensitizePhone(user.getPhone()));
        vo.setNickname(user.getNickname());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setAge(user.getAge());
        vo.setGoal(user.getGoal());
        vo.setLevel(user.getLevel());
        vo.setCefrLevel(user.getCefrLevel());
        vo.setLastLoginAt(user.getLastLoginAt());
        vo.setCreatedAt(user.getCreatedAt());
        return vo;
    }

    /** 手机号脱敏：138****5678 */
    private String desensitizePhone(String phone) {
        if (phone == null || phone.length() != 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    /** 生成默认昵称 */
    private String generateDefaultNickname(String email, String phone) {
        if (email != null && !email.isEmpty()) {
            return email.split("@")[0];
        }
        if (phone != null && !phone.isEmpty()) {
            return desensitizePhone(phone);
        }
        return "用户" + System.currentTimeMillis() % 100000;
    }
}
