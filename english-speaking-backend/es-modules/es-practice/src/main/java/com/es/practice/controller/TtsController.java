package com.es.practice.controller;

import com.es.aigw.adapter.TtsAdapter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * TTS 语音合成接口
 * 将文本实时合成为 MP3 音频流返回
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tts")
public class TtsController {

    private final TtsAdapter ttsAdapter;

    public TtsController(TtsAdapter ttsAdapter) {
        this.ttsAdapter = ttsAdapter;
    }

    @PostMapping("/synthesize")
    public ResponseEntity<byte[]> synthesize(@Valid @RequestBody TtsRequest req) {
        log.info("TTS 合成请求: text={}", req.getText().substring(0, Math.min(50, req.getText().length())));
        byte[] audio = ttsAdapter.synthesize(req.getText(), req.getVoice());

        if (audio == null || audio.length == 0) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
            .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(audio.length))
            .body(audio);
    }

    @Data
    public static class TtsRequest {
        @NotBlank(message = "文本不能为空")
        @Size(max = 500, message = "文本不能超过500个字符")
        private String text;

        private String voice;
    }
}
