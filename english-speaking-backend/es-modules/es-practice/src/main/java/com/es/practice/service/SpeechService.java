package com.es.practice.service;

import com.es.practice.dto.SpeechEvalResultVO;
import com.es.practice.dto.SpeechTopicVO;

import java.util.List;

public interface SpeechService {
    List<SpeechTopicVO> getTopics(String category, String difficulty);
    SpeechTopicVO getTopicDetail(Integer topicId);
    Long startSpeech(Long userId, Integer topicId);
    SpeechEvalResultVO submitSpeech(Long userId, Long sessionId, byte[] audio, int durationSeconds);
    SpeechEvalResultVO getResult(Long sessionId);
}
