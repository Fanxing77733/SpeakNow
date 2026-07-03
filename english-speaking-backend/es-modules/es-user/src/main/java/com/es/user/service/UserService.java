package com.es.user.service;

import com.es.user.dto.*;

import java.util.List;

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

    /** 修改密码 */
    void changePassword(Long userId, ChangePasswordDTO dto, String ip);

    /** 获取活跃设备列表 */
    List<SessionVO> getActiveSessions(Long userId, String currentToken);

    /** 踢出指定设备 */
    void kickSession(Long userId, String sessionId, String currentToken, String ip);

    /** 申请账号注销 */
    void requestDeactivation(Long userId, String ip);

    /** 撤销注销申请 */
    void cancelDeactivation(Long userId, String ip);

    /** 微信 OAuth 登录（查找或创建用户） */
    LoginResult loginByWechat(String code, String ip);

    /**
     * 更新个人资料返回值
     */
    record UpdateProfileResult(UserVO user, boolean targetChanged) {}
}
