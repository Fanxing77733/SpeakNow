package com.es.practice.service;

import com.es.practice.dto.ConversationResultVO;
import com.es.practice.dto.MessageVO;
import com.es.practice.dto.ScoreResultVO;
import com.es.practice.dto.SendMessageResultVO;
import com.es.practice.dto.StartSessionDTO;
import org.springframework.web.multipart.MultipartFile;

/**
 * 智能情景对话业务接口
 */
public interface ConversationService {

    /**
     * 开始对话会话
     * @param userId 当前用户 ID
     * @param dto    场景和难度选择
     * @return 会话结果（含 AI 第一轮消息）
     */
    ConversationResultVO startSession(Long userId, StartSessionDTO dto);

    /**
     * 发送一轮对话消息
     * @param userId    当前用户 ID
     * @param sessionId 会话 ID
     * @param audioFile 用户录音文件
     * @return 本轮消息结果（含 userText + aiText）
     */
    SendMessageResultVO processMessage(Long userId, Long sessionId, MultipartFile audioFile, Double durationSeconds);

    /**
     * 结束对话并独立评分
     * @param userId    当前用户 ID
     * @param sessionId 会话 ID
     * @return 评分结果
     */
    ScoreResultVO endSession(Long userId, Long sessionId);
}
