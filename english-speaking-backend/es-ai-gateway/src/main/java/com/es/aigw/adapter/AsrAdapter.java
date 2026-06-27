package com.es.aigw.adapter;

/**
 * 语音识别（ASR）适配器接口
 * 各供应商实现：腾讯云 ASR、阿里云 ASR 等
 */
public interface AsrAdapter {

    /**
     * 语音识别
     * @param audioBytes 音频字节（必须为 16kHz Mono WAV 格式）
     * @return 识别出的文本；识别失败返回 null
     */
    String recognize(byte[] audioBytes);
}
