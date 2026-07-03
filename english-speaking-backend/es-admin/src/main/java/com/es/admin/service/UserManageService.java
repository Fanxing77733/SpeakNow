package com.es.admin.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.es.user.dto.UserVO;
import com.es.admin.dto.UserSearchDTO;

public interface UserManageService {

    Page<UserVO> searchUsers(UserSearchDTO dto);

    void banUser(Long userId, String reason, Long operatorId, String ip);

    void unbanUser(Long userId, Long operatorId, String ip);
}
