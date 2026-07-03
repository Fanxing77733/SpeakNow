package com.es.aigw.adapter;

/**
 * TTS 语音合成适配器接口
 * 各供应商实现：Edge TTS、Azure TTS 等
 */
public interface TtsAdapter {

    /**
     * 文本转语音
     * @param text 要合成的文本
     * @param voice 语音名称，默认 "en-US-AriaNeural"
     * @return 音频字节数组（MP3 格式）
     */
    byte[] synthesize(String text, String voice);
}
