package com.es.practice.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * 用户输入过滤器
 * 对用户语音转写文本做长度截断（≤500 字符）和敏感词正则检测
 */
@Slf4j
@Component
public class InputFilter {

    private static final int MAX_LENGTH = 500;

    /**
     * 敏感词组合正则（不区分大小写）
     * 覆盖类别：暴力、色情、政治敏感、仇恨言论
     * V1.0 使用基础词库，V2.0 可扩展为外部词库 + 语义检测
     */
    private static final Pattern SENSITIVE_PATTERN = Pattern.compile(
            // 暴力相关
            "(?i)\\b(kill|murder|shoot|bomb|attack|terrorist|weapon|destroy|hurt|blood|death|suicide|explosive)\\b|"
            // 色情内容
            + "(?i)\\b(sex|porn|naked|nude|erotic|intercourse|orgasm|prostitute|pornography)\\b|"
            // 政治敏感
            + "(?i)\\b(whitewash|propaganda|incite|overthrow|separatist|terrorism|extremis(t|m))\\b|"
            // 仇恨言论
            + "(?i)\\b(racist|discriminat(e|ion)|insult|retard|stupid idiot|hate speech)\\b"
    );

    /**
     * 过滤用户输入文本
     * <ol>
     *   <li>截断超过 500 字符的部分</li>
     *   <li>检测并替换敏感词为 "[内容已过滤]"</li>
     * </ol>
     * @param input 原始输入文本
     * @return 过滤后的文本
     */
    public String filter(String input) {
        if (input == null || input.isEmpty()) {
            return "";
        }

        String filtered = input;

        // 第一步：长度截断
        if (filtered.length() > MAX_LENGTH) {
            log.warn("用户输入超长被截断: {} 字符 → {} 字符", filtered.length(), MAX_LENGTH);
            filtered = filtered.substring(0, MAX_LENGTH);
        }

        // 第二步：敏感词检测与替换
        if (SENSITIVE_PATTERN.matcher(filtered).find()) {
            log.warn("检测到敏感词，已替换: input_length={}", filtered.length());
            filtered = SENSITIVE_PATTERN.matcher(filtered).replaceAll("[内容已过滤]");
        }

        return filtered;
    }

    /**
     * 仅检测是否包含敏感词（不替换）
     * @param input 待检测文本
     * @return true 表示包含敏感词
     */
    public boolean containsSensitiveWords(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }
        return SENSITIVE_PATTERN.matcher(input).find();
    }
}
