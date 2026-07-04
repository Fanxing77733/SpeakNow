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
import java.util.Arrays;
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

        // 生成各维度分（随机 75-95），V2.0 五维评分
        int accuracy = randomScore(75, 95);
        int fluency = randomScore(75, 95);
        int completeness = randomScore(75, 95);
        int stress = randomScore(70, 95);
        int intonation = randomScore(70, 95);
        BigDecimal totalScore = BigDecimal.valueOf((accuracy + fluency + completeness + stress + intonation) / 5.0)
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
        result.setStressScore(BigDecimal.valueOf(stress));
        result.setIntonationScore(BigDecimal.valueOf(intonation));
        result.setTotalScore(totalScore);
        result.setWordResults(wordResults);
        result.setAsrText(referenceText);

        // 生成丰富的 Mock 评语和建议
        int total = totalScore.intValue();
        result.setLevelLabel(getLevelLabel(total));
        result.setComment(generateComment(total, accuracy, fluency));
        result.setStrengths(generateStrengths(accuracy, fluency, completeness, stress, intonation));
        result.setWeaknesses(generateWeaknesses(accuracy, fluency, completeness, stress, intonation));

        log.info("Mock 发音评测完成: totalScore={}", totalScore);
        return result;
    }

    private String getLevelLabel(int totalScore) {
        if (totalScore >= 90) return "发音大师";
        if (totalScore >= 80) return "流利表达者";
        if (totalScore >= 70) return "发音进阶者";
        if (totalScore >= 60) return "发音学习者";
        return "发音新星";
    }

    private String generateComment(int total, int accuracy, int fluency) {
        if (total >= 90) {
            return "非常出色！你的发音准确度很高，语调自然流畅，展现了优秀的英语口语能力。"
                + "继续保持这个水平，你可以尝试更有挑战性的长句和复杂表达。";
        } else if (total >= 80) {
            return "表现不错！整体发音清晰准确，大部分单词都读得很好。"
                + "建议多注意个别辅音的发音（如 th、v），以及句子重音的把握，会让你的口语更加地道。";
        } else if (total >= 70) {
            return "有进步空间！你的发音基本能让人听懂，但在准确度和流利度上还有提升空间。"
                + "建议放慢语速，先把每个单词读清楚，再逐步提高连贯性。";
        } else if (total >= 60) {
            return "继续加油！你已经迈出了第一步。建议从简单句子开始，反复跟读模仿，"
                + "重点关注元音发音和单词重音，打好基础后再提速。";
        } else {
            return "别灰心！学习语言需要时间和耐心。建议多听标准发音，从单个单词开始练习，"
                + "逐步过渡到短语和短句，每天坚持 10 分钟就会看到进步。";
        }
    }

    private List<String> generateStrengths(int accuracy, int fluency, int completeness, int stress, int intonation) {
        List<String> strengths = new ArrayList<>();
        int[] scores = {accuracy, fluency, completeness, stress, intonation};
        String[] labels = {"发音准确度", "朗读流利度", "内容完整度", "重音准确度", "语调自然度"};
        for (int i = 0; i < scores.length; i++) {
            if (scores[i] >= 80) {
                strengths.add(labels[i] + "表现优秀（" + scores[i] + "分）");
            }
        }
        if (strengths.isEmpty()) {
            strengths.add("勇于开口说英语的积极性值得肯定");
        }
        return strengths;
    }

    private List<String> generateWeaknesses(int accuracy, int fluency, int completeness, int stress, int intonation) {
        List<String> weaknesses = new ArrayList<>();
        int[] scores = {accuracy, fluency, completeness, stress, intonation};
        String[] labels = {"发音准确度", "朗读流利度", "内容完整度", "重音准确度", "语调自然度"};
        String[] tips = {
            "建议多听原声并逐词跟读模仿",
            "建议先放慢语速，确保每个词读清楚后再加速",
            "注意不要漏读或跳词，完整朗读整个句子",
            "多注意单词的重音音节位置",
            "注意陈述句降调、疑问句升调的基本规则"
        };
        for (int i = 0; i < scores.length; i++) {
            if (scores[i] < 80) {
                weaknesses.add(labels[i] + "需加强（" + scores[i] + "分），" + tips[i]);
            }
        }
        if (weaknesses.isEmpty()) {
            weaknesses.add("可以尝试更复杂的句型和更快的语速来挑战自己");
        }
        return weaknesses;
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
