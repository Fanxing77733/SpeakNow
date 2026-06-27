package com.es.aigw.adapter.impl;

import com.es.aigw.adapter.AsrAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * ASR 适配器 Mock 实现（开发环境专用）
 * 模拟语音识别，返回固定文本，延时 500ms
 */
@Slf4j
@Component
@Profile("dev")
public class MockAsrAdapter implements AsrAdapter {

    private static final String MOCK_TEXT = "Hello, how are you today?";

    @Override
    public String recognize(byte[] audioBytes) {
        log.info("Mock ASR 识别开始, 音频大小: {} bytes", audioBytes != null ? audioBytes.length : 0);
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Mock ASR 延时被中断");
        }
        log.info("Mock ASR 识别完成: {}", MOCK_TEXT);
        return MOCK_TEXT;
    }
}
