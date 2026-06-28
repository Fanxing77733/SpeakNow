package com.es.aigw.adapter.impl;

import com.es.aigw.adapter.PronunciationEvalAdapter;
import com.es.aigw.dto.PhonemeResult;
import com.es.aigw.dto.PronunciationEvalResult;
import com.es.aigw.dto.WordResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 发音评测适配器 Mock 实现（开发环境专用）
 * 模拟发音评测结果，返回随机评分，延时 800ms
 * 参考文本按空格拆词，每个词生成随机得分和音素评测
 */
@Slf4j
@Component
@Profile({"dev", "prod"})
public class MockPronunciationEvalAdapter implements PronunciationEvalAdapter {

    private static final Random RANDOM = new Random();

    /** 常见英语音素列表 */
    private static final String[] MOCK_PHONEMES = {
            "th", "ae", "t", "s", "ih", "n", "d", "k", "p", "r",
            "ah", "m", "eh", "l", "ow", "v", "f", "b", "g", "uw"
    };

    @Override
    public PronunciationEvalResult evaluate(byte[] audioBytes, String referenceText) {
        log.info("Mock 发音评测开始, 参考文本: {}, 音频大小: {} bytes",
                referenceText, audioBytes != null ? audioBytes.length : 0);

        try {
            Thread.sleep(800);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Mock 发音评测延时被中断");
        }

        // 拆分参考文本为单词
        String[] words = referenceText.replaceAll("[^a-zA-Z' ]", "").split("\\s+");

        // 生成各维度分（随机 75-95）
        int accuracy = randomScore(75, 95);
        int fluency = randomScore(75, 95);
        int completeness = randomScore(75, 95);
        BigDecimal totalScore = BigDecimal.valueOf((accuracy + fluency + completeness) / 3.0)
                .setScale(1, RoundingMode.HALF_UP);

        // 生成逐词结果
        List<WordResult> wordResults = new ArrayList<>();
        for (String word : words) {
            if (word.isBlank()) continue;
            wordResults.add(buildWordResult(word));
        }

        PronunciationEvalResult result = new PronunciationEvalResult();
        result.setAccuracyScore(BigDecimal.valueOf(accuracy));
        result.setFluencyScore(BigDecimal.valueOf(fluency));
        result.setCompletenessScore(BigDecimal.valueOf(completeness));
        result.setTotalScore(totalScore);
        result.setWordResults(wordResults);
        result.setAsrText(referenceText);

        log.info("Mock 发音评测完成: totalScore={}", totalScore);
        return result;
    }

    /**
     * 为单个词构建评测结果（含音素详情）
     */
    private WordResult buildWordResult(String word) {
        int wordScore = randomScore(60, 100);

        // 每个词生成 1-3 个随机音素
        int phonemeCount = RANDOM.nextInt(3) + 1;
        List<PhonemeResult> phonemes = new ArrayList<>(phonemeCount);
        for (int i = 0; i < phonemeCount && i < word.length(); i++) {
            String phoneme = MOCK_PHONEMES[RANDOM.nextInt(MOCK_PHONEMES.length)];
            int phonemeScore = randomScore(50, 100);
            phonemes.add(new PhonemeResult(phoneme, BigDecimal.valueOf(phonemeScore)));
        }

        return new WordResult(word, BigDecimal.valueOf(wordScore), phonemes);
    }

    /**
     * 生成指定范围内的随机分数（闭区间）
     */
    private int randomScore(int min, int max) {
        return RANDOM.nextInt(max - min + 1) + min;
    }
}
