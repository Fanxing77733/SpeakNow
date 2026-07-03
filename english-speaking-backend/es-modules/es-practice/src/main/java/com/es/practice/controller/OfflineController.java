package com.es.practice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.aigw.adapter.AsrAdapter;
import com.es.aigw.adapter.PronunciationEvalAdapter;
import com.es.common.dto.Result;
import com.es.practice.entity.ContentSentence;
import com.es.practice.entity.SpeechTopic;
import com.es.practice.mapper.ContentSentenceMapper;
import com.es.practice.mapper.SpeechTopicMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/offline")
public class OfflineController {

    private final ContentSentenceMapper sentenceMapper;
    private final SpeechTopicMapper topicMapper;
    private final AsrAdapter asrAdapter;
    private final PronunciationEvalAdapter evalAdapter;

    public OfflineController(ContentSentenceMapper sentenceMapper,
                              SpeechTopicMapper topicMapper,
                              AsrAdapter asrAdapter,
                              PronunciationEvalAdapter evalAdapter) {
        this.sentenceMapper = sentenceMapper;
        this.topicMapper = topicMapper;
        this.asrAdapter = asrAdapter;
        this.evalAdapter = evalAdapter;
    }

    /** 下载离线练习数据包 */
    @GetMapping("/pack")
    public Result<Map<String, Object>> downloadPack() {
        // 获取 50 条跟读句子
        List<ContentSentence> sentences = sentenceMapper.selectList(
            new LambdaQueryWrapper<ContentSentence>()
                .orderByAsc(ContentSentence::getDifficulty)
                .last("LIMIT 50")
        );

        // 获取话题列表
        List<SpeechTopic> topics = topicMapper.selectList(
            new LambdaQueryWrapper<com.es.practice.entity.SpeechTopic>()
                .eq(com.es.practice.entity.SpeechTopic::getIsPublished, 1)
                .last("LIMIT 10")
        );

        List<Map<String, Object>> sentenceList = sentences.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("text", s.getSentence());
            m.put("difficulty", s.getDifficulty());
            m.put("topicTag", s.getCategory());
            return m;
        }).collect(Collectors.toList());

        List<Map<String, Object>> topicList = topics.stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("title", t.getTitle());
            m.put("category", t.getCategory());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> pack = new LinkedHashMap<>();
        pack.put("version", "1.0");
        pack.put("sentences", sentenceList);
        pack.put("topics", topicList);
        return Result.ok(pack);
    }

    /** 同步离线练习记录 */
    @PostMapping("/sync")
    public Result<List<SyncResult>> syncRecords(@RequestBody List<OfflineRecord> records) {
        Long userId = getCurrentUserId();
        List<SyncResult> results = new ArrayList<>();

        for (OfflineRecord record : records) {
            SyncResult sr = new SyncResult();
            sr.setRecordId(record.getRecordId());
            try {
                // 1. ASR 识别
                String asrText = asrAdapter.recognize(record.getAudioData());
                sr.setAsrText(asrText);

                // 2. 发音评测
                String refText = record.getReferenceText() != null ? record.getReferenceText() : asrText;
                var evalResult = evalAdapter.evaluate(record.getAudioData(), refText);
                sr.setTotalScore(evalResult.getTotalScore());
                sr.setSuccess(true);
            } catch (Exception e) {
                log.error("同步评测失败: recordId={}", record.getRecordId(), e);
                sr.setSuccess(false);
                sr.setError("评测服务繁忙");
            }
            results.add(sr);
        }

        return Result.ok(results);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }

    @Data
    public static class OfflineRecord {
        private String recordId;
        private Long contentId;
        private String referenceText;
        private int durationSeconds;
        private byte[] audioData;
    }

    @Data
    public static class SyncResult {
        private String recordId;
        private boolean success;
        private String asrText;
        private BigDecimal totalScore;
        private String error;
    }
}
