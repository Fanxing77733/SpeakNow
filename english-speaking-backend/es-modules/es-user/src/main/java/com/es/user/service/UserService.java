package com.es.user.service;

import com.es.user.dto.*;

/**
 * 用户中心业务逻辑接口
 */
public interface UserService {

    /** 用户注册 */
    LoginResult register(RegisterDTO dto, String ip);

    /** 用户登录 */
    LoginResult login(LoginDTO dto, String ip);

    /** 查看个人资料 */
    UserVO getProfile(Long userId);

    /** 编辑个人资料，返回是否改变了年龄或学习目标 */
    UpdateProfileResult updateProfile(Long userId, ProfileDTO dto);

    /** 更新用户水平等级（测评完成后调用） */
    void updateLevel(Long userId, String level);

    /**
     * 更新个人资料返回值
     */
    record UpdateProfileResult(UserVO user, boolean targetChanged) {}
}
