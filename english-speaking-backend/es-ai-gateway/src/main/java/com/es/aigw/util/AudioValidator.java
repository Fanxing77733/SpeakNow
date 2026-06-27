package com.es.aigw.util;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 音频校验工具
 * 校验音频大小（≤5MB）和时长（0.5s-60s）
 * 默认假定音频为 16kHz Mono 16-bit PCM WAV 格式
 */
@Slf4j
@Component
public class AudioValidator {

    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    private static final double MIN_DURATION_SECONDS = 0.5;
    private static final double MAX_DURATION_SECONDS = 60.0;

    /** 标准 PCM WAV 头部大小（RIFF header + fmt chunk + data chunk header） */
    private static final int WAV_HEADER_SIZE = 44;

    /**
     * 校验音频字节（使用 WAV 头部解析时长，兼容旧调用方）
     * @param audioBytes 音频原始字节
     * @return 校验结果
     */
    public ValidationResult validate(byte[] audioBytes) {
        return validate(audioBytes, -1.0);
    }

    /**
     * 校验音频字节，优先使用前端传入的实际录音时长
     * @param audioBytes               音频原始字节
     * @param frontendDurationSeconds  前端传入的实际录音时长（秒），传入负值则回退到 WAV 头部解析
     * @return 校验结果
     */
    public ValidationResult validate(byte[] audioBytes, double frontendDurationSeconds) {
        // 空数据
        if (audioBytes == null || audioBytes.length == 0) {
            return ValidationResult.fail("未收到录音数据，请重新录制");
        }

        // 大小校验
        if (audioBytes.length > MAX_SIZE_BYTES) {
            return ValidationResult.fail("录音文件过大，请重新录制");
        }

        // 时长：优先使用前端传入的实际录音时长（MediaRecorder 计时，准确度高）
        double durationSeconds;
        if (frontendDurationSeconds >= 0) {
            durationSeconds = frontendDurationSeconds;
        } else {
            // 回退：解析 WAV 头部（仅对 PCM WAV 准确，压缩格式误差大）
            try {
                durationSeconds = parseWavDuration(audioBytes);
            } catch (Exception e) {
                log.warn("无法解析 WAV 时长，使用文件大小估算: {}", e.getMessage());
                // 兜底：按 16kHz Mono 16-bit 估算
                int audioDataSize = audioBytes.length - WAV_HEADER_SIZE;
                if (audioDataSize < 0) {
                    return ValidationResult.fail("未收到录音数据，请重新录制");
                }
                durationSeconds = audioDataSize / 32000.0;
            }
        }

        log.debug("音频校验: size={} bytes, duration={}s", audioBytes.length, durationSeconds);

        // 时长过短
        if (durationSeconds < MIN_DURATION_SECONDS) {
            return ValidationResult.fail("未检测到有效语音，请重新朗读");
        }

        // 时长过长
        if (durationSeconds > MAX_DURATION_SECONDS) {
            return ValidationResult.fail("录音请控制在60秒以内");
        }

        return ValidationResult.ok();
    }

    /**
     * 解析 WAV 头部获取音频时长
     * WAV PCM 格式：16kHz Mono 16-bit = 32000 字节/秒
     */
    public double parseWavDuration(byte[] audioBytes) {
        if (audioBytes.length < WAV_HEADER_SIZE) {
            // 不是标准 WAV，直接按文件大小估算
            return audioBytes.length / 32000.0;
        }

        // 检查 RIFF 标识
        if (audioBytes[0] != 'R' || audioBytes[1] != 'I' || audioBytes[2] != 'F' || audioBytes[3] != 'F') {
            // 非 WAV 格式，按原始 PCM 16kHz Mono 16-bit 估算
            return audioBytes.length / 32000.0;
        }

        // 解析 WAV 头部关键字段
        // offset 22-23: 声道数 (1=Mono)
        int channels = readLittleEndianShort(audioBytes, 22);

        // offset 24-27: 采样率
        int sampleRate = readLittleEndianInt(audioBytes, 24);

        // offset 34-35: 位深度
        int bitsPerSample = readLittleEndianShort(audioBytes, 34);

        // 定位 "data" 子块获取音频数据大小
        int dataSize = findDataChunkSize(audioBytes);
        if (dataSize <= 0) {
            // 未找到 data 块，用文件总大小减去头部估算
            dataSize = audioBytes.length - WAV_HEADER_SIZE;
        }

        if (sampleRate <= 0 || channels <= 0 || bitsPerSample <= 0) {
            return 0;
        }

        double bytesPerSecond = sampleRate * channels * (bitsPerSample / 8.0);
        return dataSize / bytesPerSecond;
    }

    /** 读取小端序 2 字节无符号整数 */
    private int readLittleEndianShort(byte[] bytes, int offset) {
        return ((bytes[offset + 1] & 0xFF) << 8) | (bytes[offset] & 0xFF);
    }

    /** 读取小端序 4 字节整数 */
    private int readLittleEndianInt(byte[] bytes, int offset) {
        return ((bytes[offset + 3] & 0xFF) << 24)
                | ((bytes[offset + 2] & 0xFF) << 16)
                | ((bytes[offset + 1] & 0xFF) << 8)
                | (bytes[offset] & 0xFF);
    }

    /** 在 WAV 字节中寻找 "data" 子块并返回其数据大小 */
    private int findDataChunkSize(byte[] bytes) {
        // 从 offset 36 开始查找（fmt 子块之后）
        int offset = 36;
        while (offset + 8 <= bytes.length) {
            // 检查是否是 "data" 标识
            if (bytes[offset] == 'd' && bytes[offset + 1] == 'a'
                    && bytes[offset + 2] == 't' && bytes[offset + 3] == 'a') {
                return readLittleEndianInt(bytes, offset + 4);
            }
            // 跳过当前子块
            int chunkSize = readLittleEndianInt(bytes, offset + 4);
            offset += 8 + chunkSize;
        }
        return -1;
    }

    /**
     * 音频校验结果
     */
    @Getter
    public static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;

        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public static ValidationResult ok() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult fail(String errorMessage) {
            return new ValidationResult(false, errorMessage);
        }
    }
}
