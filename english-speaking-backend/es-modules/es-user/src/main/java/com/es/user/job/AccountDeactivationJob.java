package com.es.user.job;

import com.es.user.service.impl.UserServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 账号注销定时任务：每日凌晨 4:00 执行到期账号匿名化处理
 */
@Slf4j
@Component
public class AccountDeactivationJob {

    private final UserServiceImpl userService;

    public AccountDeactivationJob(UserServiceImpl userService) {
        this.userService = userService;
    }

    @Scheduled(cron = "0 0 4 * * ?")
    public void processExpiredDeactivations() {
        log.info("开始执行到期账号注销任务");
        userService.processExpiredDeactivations();
        log.info("到期账号注销任务完成");
    }
}
