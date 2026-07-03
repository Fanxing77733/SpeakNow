package com.es.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.exception.BusinessException;
import com.es.security.util.JwtUtil;
import com.es.user.dto.*;
import com.es.user.entity.AuditLog;
import com.es.user.entity.User;
import com.es.user.mapper.AuditLogMapper;
import com.es.user.mapper.UserMapper;
import com.es.user.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class UserServiceImpl implements UserService {

    private static final int REGISTER_RATE_LIMIT = 3;
    private static final int LOGIN_RATE_LIMIT = 10;
    private static final int MAX_LOGIN_ERRORS = 5;
    private static final int LOCK_DURATION_SECONDS = 1800;
    private static final int RATE_LIMIT_WINDOW_SECONDS = 60;
    private static final long TOKEN_EXPIRE_SECONDS = 604800; // 7 天
    private static final int DEACTIVATION_COOLING_DAYS = 7;

    private final UserMapper userMapper;
    private final AuditLogMapper auditLogMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;

    public UserServiceImpl(UserMapper userMapper,
                           AuditLogMapper auditLogMapper,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           StringRedisTemplate redisTemplate) {
        this.userMapper = userMapper;
        this.auditLogMapper = auditLogMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.redisTemplate = redisTemplate;
    }

    // ======================== 注册 ========================

    @Override
    @Transactional
    public LoginResult register(RegisterDTO dto, String ip) {
        checkRegisterRateLimit(ip);
        checkUnique(dto);

        String encodedPassword = passwordEncoder.encode(dto.getPassword());

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPasswordHash(encodedPassword);
        user.setNickname(generateDefaultNickname(dto.getEmail(), dto.getPhone()));
        user.setAge(dto.getAge());
        user.setGoal(dto.getGoal());
        user.setStatus("active");
        user.setRole("LEARNER");
        user.setPhoneVerified(0);
        user.setEmailVerified(0);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.insert(user);
        log.info("用户注册成功: userId={}", user.getId());

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        storeSessionToken(user.getId(), token, ip, "注册");
        UserVO userVO = toUserVO(user);
        return new LoginResult(token, userVO);
    }

    // ======================== 登录 ========================

    @Override
    @Transactional
    public LoginResult login(LoginDTO dto, String ip) {
        checkLoginRateLimit(ip);

        User user = findByAccount(dto.getAccount());
        if (user == null) {
            throw new BusinessException(404, "账号不存在，请先注册");
        }

        // 检查封禁状态
        if ("banned".equals(user.getStatus())) {
            throw new BusinessException(403, "账号已被封禁，如有疑问请联系客服");
        }

        // 检查注销状态
        if ("PENDING_DELETION".equals(user.getDeactivationStatus())) {
            cancelDeactivationInternal(user);
        }

        checkLockStatus(user.getId());
        verifyPassword(dto.getPassword(), user);

        clearLoginErrors(user.getId());

        String token = jwtUtil.generateToken(user.getId(), user.getRole());
        storeSessionToken(user.getId(), token, ip, "登录");

        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(ip);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        log.info("用户登录成功: userId={}", user.getId());

        UserVO userVO = toUserVO(user);
        return new LoginResult(token, userVO);
    }

    // ======================== 资料 ========================

    @Override
    public UserVO getProfile(Long userId) {
        User user = findById(userId);
        return toUserVO(user);
    }

    @Override
    @Transactional
    public UpdateProfileResult updateProfile(Long userId, ProfileDTO dto) {
        User user = findById(userId);
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
        User user = findById(userId);
        user.setLevel(level);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        log.info("用户水平等级更新: userId={}, level={}", userId, level);
    }

    // ======================== 安全中心 ========================

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordDTO dto, String ip) {
        User user = findById(userId);

        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPasswordHash())) {
            writeAuditLog(userId, "CHANGE_PASSWORD", null, ip, "FAIL", "原密码错误");
            throw new BusinessException(400, "原密码错误");
        }

        user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        // 踢出所有设备（当前设备除外由前端处理重新登录）
        clearAllSessions(userId);

        writeAuditLog(userId, "CHANGE_PASSWORD", null, ip, "SUCCESS", null);
        log.info("密码修改成功: userId={}", userId);
    }

    @Override
    public List<SessionVO> getActiveSessions(Long userId, String currentToken) {
        List<SessionVO> sessions = new ArrayList<>();
        try {
            String pattern = "user:token:" + userId + ":*";
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null) {
                for (String key : keys) {
                    Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
                    if (data.isEmpty()) continue;
                    String tokenPart = key.substring(key.lastIndexOf(":") + 1);
                    String tokenHash = tokenPart.length() > 16 ? tokenPart.substring(0, 8) : tokenPart;
                    boolean isCurrent = currentToken != null && currentToken.contains(tokenPart);

                    sessions.add(SessionVO.builder()
                            .id(tokenHash)
                            .ip(String.valueOf(data.getOrDefault("ip", "")))
                            .userAgent(String.valueOf(data.getOrDefault("ua", "")))
                            .loginTime(String.valueOf(data.getOrDefault("loginTime", "")))
                            .current(isCurrent)
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Redis 不可用，跳过设备查询: {}", e.getMessage());
        }
        sessions.sort((a, b) -> Boolean.compare(b.isCurrent(), a.isCurrent()));
        return sessions;
    }

    @Override
    public void kickSession(Long userId, String sessionId, String currentToken, String ip) {
        try {
            String pattern = "user:token:" + userId + ":" + sessionId + "*";
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null) {
                for (String key : keys) {
                    redisTemplate.delete(key);
                }
            }
            writeAuditLog(userId, "KICK_SESSION", sessionId, ip, "SUCCESS", null);
            log.info("设备已踢出: userId={}, sessionId={}", userId, sessionId);
        } catch (Exception e) {
            log.warn("Redis 不可用，跳过踢出设备: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void requestDeactivation(Long userId, String ip) {
        User user = findById(userId);
        if ("PENDING_DELETION".equals(user.getDeactivationStatus())) {
            throw new BusinessException(400, "注销申请已提交，请等待处理");
        }
        user.setDeactivationStatus("PENDING_DELETION");
        user.setDeactivationRequestedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        writeAuditLog(userId, "DEACTIVATE_ACCOUNT", null, ip, "SUCCESS", null);
        log.info("账号注销已申请: userId={}", userId);
    }

    @Override
    @Transactional
    public void cancelDeactivation(Long userId, String ip) {
        User user = findById(userId);
        cancelDeactivationInternal(user);
        writeAuditLog(userId, "REACTIVATE_ACCOUNT", null, ip, "SUCCESS", null);
    }

    // ======================== 定时任务辅助 ========================

    /** 执行到期注销：匿名化用户数据 */
    @Transactional
    public void processExpiredDeactivations() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(DEACTIVATION_COOLING_DAYS);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getDeactivationStatus, "PENDING_DELETION")
                .le(User::getDeactivationRequestedAt, threshold);

        List<User> expiredUsers = userMapper.selectList(wrapper);
        for (User user : expiredUsers) {
            user.setNickname("已注销用户");
            user.setEmail(null);
            user.setPhone(null);
            user.setPasswordHash(null);
            user.setStatus("deleted");
            user.setDeactivationStatus(null);
            user.setDeactivationReactivatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userMapper.updateById(user);
            clearAllSessions(user.getId());
            log.info("账号已注销: userId={}", user.getId());
        }
    }

    // ======================== 微信登录 ========================

    @Value("${wechat.app-id:}")
    private String wechatAppId;

    @Value("${wechat.app-secret:}")
    private String wechatAppSecret;

    @Override
    @Transactional
    public LoginResult loginByWechat(String code, String ip) {
        if (wechatAppId.isEmpty() || wechatAppSecret.isEmpty()) {
            throw new BusinessException(503, "微信登录暂未配置");
        }

        // 1. 用 code 换 access_token 和 openid
        String accessTokenUrl = String.format(
            "https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code",
            wechatAppId, wechatAppSecret, code
        );

        JsonNode tokenResp;
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(accessTokenUrl))
                .GET()
                .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            tokenResp = new ObjectMapper().readTree(resp.body());
        } catch (Exception e) {
            log.error("微信 access_token 请求失败", e);
            throw new BusinessException(503, "微信服务繁忙，请稍后重试");
        }

        if (tokenResp.has("errcode") && tokenResp.get("errcode").asInt() != 0) {
            log.error("微信 access_token 返回错误: {}", tokenResp);
            throw new BusinessException(400, "微信授权失败，请重试");
        }

        String openid = tokenResp.get("openid").asText();
        String unionid = tokenResp.has("unionid") ? tokenResp.get("unionid").asText() : null;

        // 2. 查找或创建用户
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getWechatOpenid, openid)
        );

        if (user == null) {
            // 创建新用户
            user = new User();
            user.setWechatOpenid(openid);
            user.setWechatUnionid(unionid);
            user.setNickname("微信用户" + openid.substring(Math.max(0, openid.length() - 6)));
            user.setAge(18);
            user.setGoal("daily");
            user.setStatus("active");
            user.setRole("LEARNER");
            user.setPasswordHash(""); // 微信用户无密码
            userMapper.insert(user);

            writeAuditLog(user.getId(), "WECHAT_REGISTER", "openid=" + openid, ip, "SUCCESS", null);
            log.info("微信用户注册: userId={}, openid={}", user.getId(), openid);
        }

        // 3. 生成 JWT
        String jwt = jwtUtil.generateToken(user.getId(), user.getRole() != null ? user.getRole() : "LEARNER");
        storeSessionToken(user.getId(), jwt, ip, "WECHAT_LOGIN");
        userMapper.updateById(user);

        UserVO userVO = toUserVO(user);
        writeAuditLog(user.getId(), "WECHAT_LOGIN", null, ip, "SUCCESS", null);
        return new LoginResult(jwt, userVO);
    }

    // ======================== 私有方法 ========================

    private void cancelDeactivationInternal(User user) {
        user.setDeactivationStatus(null);
        user.setDeactivationReactivatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        log.info("注销申请已撤销: userId={}", user.getId());
    }

    private void storeSessionToken(Long userId, String token, String ip, String action) {
        try {
            String tokenSuffix = token.substring(Math.max(0, token.length() - 16));
            String key = "user:token:" + userId + ":" + tokenSuffix;
            Map<String, String> data = new HashMap<>();
            data.put("ip", ip != null ? ip : "");
            data.put("ua", "");
            data.put("loginTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            redisTemplate.opsForHash().putAll(key, data);
            redisTemplate.expire(key, TOKEN_EXPIRE_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Redis 不可用，跳过设备记录: {}", e.getMessage());
        }
    }

    private void clearAllSessions(Long userId) {
        try {
            String pattern = "user:token:" + userId + ":*";
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null) {
                for (String key : keys) {
                    redisTemplate.delete(key);
                }
            }
        } catch (Exception e) {
            log.warn("Redis 不可用，跳过清除会话: {}", e.getMessage());
        }
    }

    private void writeAuditLog(Long userId, String action, String target, String ip,
                               String result, String detail) {
        try {
            AuditLog logEntry = new AuditLog();
            logEntry.setUserId(userId);
            logEntry.setAction(action);
            logEntry.setTarget(target);
            logEntry.setIp(ip);
            logEntry.setResult(result);
            logEntry.setDetail(detail);
            logEntry.setCreatedAt(LocalDateTime.now());
            auditLogMapper.insert(logEntry);
        } catch (Exception e) {
            log.warn("审计日志写入失败: {}", e.getMessage());
        }
    }

    private User findById(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return user;
    }

    private void checkRegisterRateLimit(String ip) {
        checkRateLimit("register:rate:" + ip, REGISTER_RATE_LIMIT, "操作过于频繁，请稍后再试");
    }

    private void checkLoginRateLimit(String ip) {
        checkRateLimit("login:rate:" + ip, LOGIN_RATE_LIMIT, "操作过于频繁，请稍后再试");
    }

    private void checkRateLimit(String key, int limit, String message) {
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, RATE_LIMIT_WINDOW_SECONDS, TimeUnit.SECONDS);
            }
            if (count != null && count > limit) {
                log.warn("限流触发: key={}, count={}", key, count);
                throw new BusinessException(429, message);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis 不可用，跳过限流检查: {}", e.getMessage());
        }
    }

    private void checkLockStatus(Long userId) {
        try {
            String lockKey = "login:lock:" + userId;
            if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
                throw new BusinessException(403, "账号已被临时锁定，请30分钟后再试");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis 不可用，跳过锁定状态检查: {}", e.getMessage());
        }
    }

    private void verifyPassword(String rawPassword, User user) {
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            try {
                String errorKey = "login:error:" + user.getId();
                Long errorCount = redisTemplate.opsForValue().increment(errorKey);
                if (errorCount != null && errorCount == 1) {
                    redisTemplate.expire(errorKey, LOCK_DURATION_SECONDS, TimeUnit.SECONDS);
                }
                int remaining = MAX_LOGIN_ERRORS - (errorCount != null ? errorCount.intValue() : 1);
                if (remaining <= 0) {
                    String lockKey = "login:lock:" + user.getId();
                    redisTemplate.opsForValue().set(lockKey, "1", LOCK_DURATION_SECONDS, TimeUnit.SECONDS);
                    redisTemplate.delete(errorKey);
                    log.warn("账号已被锁定: userId={}", user.getId());
                    throw new BusinessException(403, "账号已被临时锁定，请30分钟后再试");
                }
                throw new BusinessException(401, "密码错误，请重试（剩余" + remaining + "次）");
            } catch (BusinessException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Redis 不可用，跳过错误计数: {}", e.getMessage());
                throw new BusinessException(401, "密码错误，请重试");
            }
        }
    }

    private void clearLoginErrors(Long userId) {
        try {
            redisTemplate.delete("login:error:" + userId);
        } catch (Exception e) {
            log.warn("Redis 不可用，跳过清除错误计数: {}", e.getMessage());
        }
    }

    private void checkUnique(RegisterDTO dto) {
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
    }

    private User findByAccount(String account) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, account).or().eq(User::getPhone, account);
        return userMapper.selectOne(wrapper);
    }

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
        vo.setRole(user.getRole());
        vo.setStatus(user.getStatus());
        vo.setLastLoginAt(user.getLastLoginAt());
        vo.setCreatedAt(user.getCreatedAt());
        return vo;
    }

    private String desensitizePhone(String phone) {
        if (phone == null || phone.length() != 11) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    private String generateDefaultNickname(String email, String phone) {
        if (email != null && !email.isEmpty()) return email.split("@")[0];
        if (phone != null && !phone.isEmpty()) return desensitizePhone(phone);
        return "用户" + System.currentTimeMillis() % 100000;
    }
}
