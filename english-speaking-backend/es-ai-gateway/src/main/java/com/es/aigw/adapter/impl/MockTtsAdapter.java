package com.es.aigw.adapter.impl;

import com.es.aigw.adapter.TtsAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Mock TTS 适配器 — 开发环境使用，返回空音频
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "aigw.tts.provider", havingValue = "mock", matchIfMissing = true)
public class MockTtsAdapter implements TtsAdapter {

    @Override
    public byte[] synthesize(String text, String voice) {
        log.info("Mock TTS: text={}, voice={}", text, voice != null ? voice : "default");
        // 返回最小的有效 MP3 帧（静音）
        return new byte[0];
    }
}
