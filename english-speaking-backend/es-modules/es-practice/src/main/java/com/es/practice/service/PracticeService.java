package com.es.practice.service;

import com.es.practice.dto.ContentSentenceVO;
import com.es.practice.dto.PronounceEvalResultVO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 口语训练业务接口
 */
public interface PracticeService {

    /**
     * 获取跟读内容列表
     * @param difficulty 难度筛选，null 表示返回全部
     */
    List<ContentSentenceVO> getContentList(String difficulty);

    /**
     * 发音评测
     * @param userId          当前用户 ID
     * @param audioFile       音频文件
     * @param contentId       跟读内容 ID
     * @param durationSeconds 前端传入的实际录音时长（秒），可为 null（回退到 WAV 头部解析）
     * @return 评测结果
     */
    PronounceEvalResultVO evaluate(Long userId, MultipartFile audioFile, Integer contentId, Double durationSeconds);

    /**
     * 查询评测记录
     * @param userId   当前用户 ID
     * @param recordId 记录 ID
     * @return 评测结果
     */
    PronounceEvalResultVO getResult(Long userId, Long recordId);
}
