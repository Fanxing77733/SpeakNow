package com.es.aigw.adapter.impl;

import com.es.aigw.adapter.TtsAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Edge TTS 适配器 — 调用 edge-tts CLI 实时合成语音
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "aigw.tts.provider", havingValue = "edgetts")
public class EdgeTtsAdapter implements TtsAdapter {

    private static final String DEFAULT_VOICE = "en-US-AriaNeural";
    private static final long TIMEOUT_SECONDS = 30;

    @Override
    public byte[] synthesize(String text, String voice) {
        String selectedVoice = voice != null && !voice.isEmpty() ? voice : DEFAULT_VOICE;
        Path tempFile = null;
        try {
            // 创建临时文件
            tempFile = Files.createTempFile("tts-" + UUID.randomUUID(), ".mp3");

            // 调用 edge-tts（Python 模块方式，兼容未加入 PATH 的环境）
            ProcessBuilder pb = new ProcessBuilder(
                "python", "-m", "edge_tts",
                "--text", text,
                "--voice", selectedVoice,
                "--write-media", tempFile.toAbsolutePath().toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.error("Edge TTS 超时: text={}", text.substring(0, Math.min(50, text.length())));
                return new byte[0];
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String errorOutput = new String(process.getInputStream().readAllBytes());
                log.error("Edge TTS 失败: exitCode={}, error={}", exitCode, errorOutput);
                return new byte[0];
            }

            // 读取生成的音频文件
            File outputFile = tempFile.toFile();
            if (!outputFile.exists() || outputFile.length() == 0) {
                log.warn("Edge TTS 未生成音频: text={}", text.substring(0, Math.min(50, text.length())));
                return new byte[0];
            }

            try (FileInputStream fis = new FileInputStream(outputFile);
                 ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[4096];
                int n;
                while ((n = fis.read(buffer)) != -1) {
                    bos.write(buffer, 0, n);
                }
                return bos.toByteArray();
            }
        } catch (Exception e) {
            log.error("Edge TTS 异常: text={}", text.substring(0, Math.min(50, text.length())), e);
            return new byte[0];
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (Exception ignored) {
                }
            }
        }
    }
}
