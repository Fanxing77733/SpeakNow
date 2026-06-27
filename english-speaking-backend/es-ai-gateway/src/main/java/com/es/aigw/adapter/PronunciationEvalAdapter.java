package com.es.aigw.adapter;

import com.es.aigw.dto.PronunciationEvalResult;

/**
 * 发音评测适配器接口
 * 各供应商实现：驰声 Chivox、讯飞 ISE、先声智能等
 */
public interface PronunciationEvalAdapter {

    /**
     * 发音评测
     * @param audioBytes 用户录音音频（16kHz Mono WAV）
     * @param referenceText 参考标准文本
     * @return 评测结果（总分 + 各维度分 + 逐词详情 + 音素详情）
     */
    PronunciationEvalResult evaluate(byte[] audioBytes, String referenceText);
}
