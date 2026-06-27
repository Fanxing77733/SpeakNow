package com.es.practice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.aigw.adapter.AsrAdapter;
import com.es.aigw.adapter.PronunciationEvalAdapter;
import com.es.aigw.dto.PhonemeResult;
import com.es.aigw.dto.PronunciationEvalResult;
import com.es.aigw.dto.WordResult;
import com.es.aigw.util.AudioValidator;
import com.es.common.exception.BusinessException;
import com.es.practice.dto.ContentSentenceVO;
import com.es.practice.dto.PhonemeResultVO;
import com.es.practice.dto.PronounceEvalResultVO;
import com.es.practice.dto.WordResultVO;
import com.es.practice.entity.ContentSentence;
import com.es.practice.entity.PracticeRecord;
import com.es.practice.mapper.ContentSentenceMapper;
import com.es.practice.mapper.PracticeRecordMapper;
import com.es.practice.service.PracticeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 口语训练业务逻辑实现
 */
@Slf4j
@Service
public class PracticeServiceImpl implements PracticeService {

    private final ContentSentenceMapper contentSentenceMapper;
    private final PracticeRecordMapper practiceRecordMapper;
    private final AsrAdapter asrAdapter;
    private final PronunciationEvalAdapter pronunciationEvalAdapter;
    private final AudioValidator audioValidator;
    private final ObjectMapper objectMapper;

    @Value("${practice.audio.local-path:./practice-audio}")
    private String audioLocalPath;

    public PracticeServiceImpl(ContentSentenceMapper contentSentenceMapper,
                               PracticeRecordMapper practiceRecordMapper,
                               AsrAdapter asrAdapter,
                               PronunciationEvalAdapter pronunciationEvalAdapter,
                               AudioValidator audioValidator,
                               ObjectMapper objectMapper) {
        this.contentSentenceMapper = contentSentenceMapper;
        this.practiceRecordMapper = practiceRecordMapper;
        this.asrAdapter = asrAdapter;
        this.pronunciationEvalAdapter = pronunciationEvalAdapter;
        this.audioValidator = audioValidator;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<ContentSentenceVO> getContentList(String difficulty) {
        LambdaQueryWrapper<ContentSentence> wrapper = new LambdaQueryWrapper<>();
        if (difficulty != null && !difficulty.isBlank()) {
            wrapper.eq(ContentSentence::getDifficulty, difficulty);
        }
        wrapper.orderByAsc(ContentSentence::getDifficulty).orderByAsc(ContentSentence::getId);

        List<ContentSentence> sentences = contentSentenceMapper.selectList(wrapper);
        return sentences.stream()
                .map(this::toContentSentenceVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PronounceEvalResultVO evaluate(Long userId, MultipartFile audioFile, Integer contentId, Double durationSeconds) {
        // 1. 读取音频字节
        byte[] audioBytes;
        try {
            audioBytes = audioFile.getBytes();
        } catch (IOException e) {
            log.error("读取音频文件失败", e);
            throw new BusinessException(422, "未收到录音数据，请重新录制");
        }

        // 2. 音频校验（时长 ≥0.5s → ≤60s → 大小 ≤5MB）
        //    优先使用前端传入的 MediaRecorder 实际计时 — 对 WebM 压缩格式准确
        double effectiveDuration = durationSeconds != null ? durationSeconds : -1.0;
        AudioValidator.ValidationResult validation = audioValidator.validate(audioBytes, effectiveDuration);
        if (!validation.isValid()) {
            throw new BusinessException(422, validation.getErrorMessage());
        }

        // 计算时长（用于存储）：优先使用前端传入的实际录音时长
        int duration;
        if (durationSeconds != null && durationSeconds >= 0) {
            duration = (int) Math.ceil(durationSeconds);
        } else {
            double parsed = audioValidator.parseWavDuration(audioBytes);
            duration = (int) Math.ceil(parsed);
        }

        // 3. 查询跟读内容获取参考文本
        ContentSentence sentence = contentSentenceMapper.selectById(contentId);
        if (sentence == null) {
            throw new BusinessException(404, "跟读内容不存在");
        }
        String referenceText = sentence.getSentence();

        // 4. AI Gateway → ASR 语音识别
        String asrText = asrAdapter.recognize(audioBytes);
        if (asrText == null || asrText.isBlank()) {
            // 保存失败记录
            saveFailedRecord(userId, contentId, audioBytes, "asr_failed", duration);
            throw new BusinessException(422, "未能识别语音内容，请确保发音清晰");
        }
        log.info("ASR 识别成功: userId={}, contentId={}, asrText={}", userId, contentId, asrText);

        // 5. AI Gateway → 发音评测
        PronunciationEvalResult evalResult;
        try {
            evalResult = pronunciationEvalAdapter.evaluate(audioBytes, referenceText);
        } catch (Exception e) {
            log.error("发音评测 API 调用失败: userId={}, contentId={}", userId, contentId, e);
            saveFailedRecord(userId, contentId, audioBytes, "eval_failed", duration);
            throw new BusinessException(503, "服务繁忙，请稍后重试");
        }
        log.info("发音评测完成: userId={}, contentId={}, totalScore={}",
                userId, contentId, evalResult.getTotalScore());

        // 6. 保存录音到本地磁盘
        String audioUrl = saveAudioToDisk(audioBytes, userId);

        // 7. 构建评测详情 JSON
        String evalDetailJson = buildEvalDetailJson(evalResult);

        // 8. 写入 practice_records
        PracticeRecord record = new PracticeRecord();
        record.setUserId(userId);
        record.setContentId(contentId);
        record.setAudioUrl(audioUrl);
        record.setTotalScore(evalResult.getTotalScore());
        record.setAccuracyScore(evalResult.getAccuracyScore());
        record.setFluencyScore(evalResult.getFluencyScore());
        record.setCompletenessScore(evalResult.getCompletenessScore());
        record.setEvalDetailJson(evalDetailJson);
        record.setStatus("completed");
        record.setDurationSeconds(duration);
        record.setCreatedAt(LocalDateTime.now());
        practiceRecordMapper.insert(record);

        log.info("评测记录已保存: recordId={}, userId={}, status=completed", record.getId(), userId);

        // 9. 构建返回 VO
        return buildResultVO(record.getId(), asrText, evalResult);
    }

    @Override
    public PronounceEvalResultVO getResult(Long userId, Long recordId) {
        PracticeRecord record = practiceRecordMapper.selectById(recordId);
        if (record == null) {
            throw new BusinessException(404, "评测记录不存在");
        }

        // 校验记录归属
        if (!record.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权查看该评测记录");
        }

        // 从 eval_detail_json 反序列化
        return buildResultVOFromRecord(record);
    }

    // ======================== 私有方法 ========================

    /**
     * 白名单方式转换 ContentSentence → ContentSentenceVO
     */
    private ContentSentenceVO toContentSentenceVO(ContentSentence entity) {
        ContentSentenceVO vo = new ContentSentenceVO();
        vo.setId(entity.getId());
        vo.setSentence(entity.getSentence());
        vo.setDifficulty(entity.getDifficulty());
        vo.setCategory(entity.getCategory());
        // 不返回 ttsAudioUrl
        return vo;
    }

    /**
     * 保存音频文件到本地磁盘
     */
    private String saveAudioToDisk(byte[] audioBytes, Long userId) {
        try {
            Path dir = Paths.get(audioLocalPath, "user_" + userId);
            Files.createDirectories(dir);

            String filename = UUID.randomUUID() + ".wav";
            Path filePath = dir.resolve(filename);
            Files.write(filePath, audioBytes);

            String relativePath = "user_" + userId + "/" + filename;
            log.debug("音频已保存: {}", relativePath);
            return relativePath;
        } catch (IOException e) {
            log.error("保存音频文件失败: userId={}", userId, e);
            throw new BusinessException(500, "服务器内部错误，请稍后再试");
        }
    }

    /**
     * 保存失败记录（ASR 失败或评测失败时）
     */
    private void saveFailedRecord(Long userId, Integer contentId, byte[] audioBytes, String status, int duration) {
        try {
            String audioUrl = saveAudioToDisk(audioBytes, userId);
            PracticeRecord record = new PracticeRecord();
            record.setUserId(userId);
            record.setContentId(contentId);
            record.setAudioUrl(audioUrl);
            record.setStatus(status);
            record.setDurationSeconds(duration);
            record.setCreatedAt(LocalDateTime.now());
            practiceRecordMapper.insert(record);
            log.info("失败记录已保存: recordId={}, userId={}, status={}", record.getId(), userId, status);
        } catch (Exception e) {
            log.error("保存失败记录异常: userId={}, status={}", userId, status, e);
        }
    }

    /**
     * 构建评测详情 JSON（逐词+音素，不做任何过滤）
     * 存储到 practice_records.eval_detail_json 中
     */
    private String buildEvalDetailJson(PronunciationEvalResult evalResult) {
        try {
            return objectMapper.writeValueAsString(evalResult);
        } catch (JsonProcessingException e) {
            log.error("序列化评测详情失败", e);
            return "{}";
        }
    }

    /**
     * 构建评测结果 VO（评测成功时）
     */
    private PronounceEvalResultVO buildResultVO(Long recordId, String asrText, PronunciationEvalResult evalResult) {
        PronounceEvalResultVO vo = new PronounceEvalResultVO();
        vo.setRecordId(recordId);
        vo.setAsrText(asrText);
        vo.setTotalScore(evalResult.getTotalScore());
        vo.setAccuracyScore(evalResult.getAccuracyScore());
        vo.setFluencyScore(evalResult.getFluencyScore());
        vo.setCompletenessScore(evalResult.getCompletenessScore());

        // 转换逐词结果，计算 color 字段
        if (evalResult.getWordResults() != null) {
            List<WordResultVO> wordResultVOs = evalResult.getWordResults().stream()
                    .map(this::toWordResultVO)
                    .collect(Collectors.toList());
            vo.setWordResults(wordResultVOs);
        }

        return vo;
    }

    /**
     * 从已存储的 practice_records 反序列化构建结果 VO
     */
    private PronounceEvalResultVO buildResultVOFromRecord(PracticeRecord record) {
        PronounceEvalResultVO vo = new PronounceEvalResultVO();
        vo.setRecordId(record.getId());
        vo.setTotalScore(record.getTotalScore());
        vo.setAccuracyScore(record.getAccuracyScore());
        vo.setFluencyScore(record.getFluencyScore());
        vo.setCompletenessScore(record.getCompletenessScore());

        // 从 eval_detail_json 反序列化逐词结果
        if (record.getEvalDetailJson() != null && !record.getEvalDetailJson().isEmpty()) {
            try {
                PronunciationEvalResult evalResult = objectMapper.readValue(
                        record.getEvalDetailJson(), PronunciationEvalResult.class);
                if (evalResult != null) {
                    vo.setAsrText(evalResult.getAsrText());
                    if (evalResult.getWordResults() != null) {
                        List<WordResultVO> wordResultVOs = evalResult.getWordResults().stream()
                                .map(this::toWordResultVO)
                                .collect(Collectors.toList());
                        vo.setWordResults(wordResultVOs);
                    }
                }
            } catch (JsonProcessingException e) {
                log.warn("反序列化评测详情失败: recordId={}", record.getId(), e);
            }
        }

        return vo;
    }

    /**
     * 将 AI Gateway 的 WordResult 转换为前端 VO，计算 color 字段
     * color 规则：score >= 80 → "green", 60-79 → "yellow", <60 → "red"
     */
    private WordResultVO toWordResultVO(WordResult wr) {
        WordResultVO vo = new WordResultVO();
        vo.setWord(wr.getWord());
        vo.setScore(wr.getScore());

        // 根据分数计算颜色
        int score = wr.getScore() != null ? wr.getScore().intValue() : 0;
        if (score >= 80) {
            vo.setColor("green");
        } else if (score >= 60) {
            vo.setColor("yellow");
        } else {
            vo.setColor("red");
        }

        // 转换音素结果
        if (wr.getPhonemeResults() != null) {
            List<PhonemeResultVO> phonemeVOs = wr.getPhonemeResults().stream()
                    .map(pr -> new PhonemeResultVO(pr.getPhoneme(), pr.getScore()))
                    .collect(Collectors.toList());
            vo.setPhonemes(phonemeVOs);
        }

        return vo;
    }
}
