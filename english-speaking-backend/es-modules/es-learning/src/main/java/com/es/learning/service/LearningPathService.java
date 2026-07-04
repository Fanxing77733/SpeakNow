package com.es.learning.service;

import com.es.learning.dto.LearningPathVO;

public interface LearningPathService {

    /** 获取当前学习路径，无则返回可选路径类型 */
    LearningPathVO getPath(Long userId);

    /** 创建学习路径 */
    LearningPathVO createPath(Long userId, String pathType);

    /** 完成一个任务 */
    LearningPathVO completeTask(Long userId, Long taskId);
}
