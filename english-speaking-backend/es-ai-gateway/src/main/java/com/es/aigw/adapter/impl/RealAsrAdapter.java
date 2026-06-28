package com.es.aigw.adapter.impl;

import com.es.aigw.adapter.AsrAdapter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 腾讯云 ASR 一句话识别适配器（生产环境）
 * 使用纯 HTTP + TC3-HMAC-SHA256 签名调用 SentenceRecognition API
 * 参考文档：https://cloud.tencent.com/document/api/1093/37817
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "aigw.asr.provider", havingValue = "tencent")
public class RealAsrAdapter implements AsrAdapter {

    @Value("${aigw.asr.secret-id}")
    private String secretId;

    @Value("${aigw.asr.secret-key}")
    private String secretKey;

    /** 腾讯云 ASR 服务端点 */
    private static final String ENDPOINT = "asr.tencentcloudapi.com";

    /** API 版本 */
    private static final String API_VERSION = "2019-06-14";

    /** 引擎模型类型：16k 英文 */
    private static final String ENG_SERVICE_TYPE = "16k_en";

    /** 音频格式 */
    private static final String VOICE_FORMAT = "wav";

    /** 签名算法 */
    private static final String ALGORITHM = "TC3-HMAC-SHA256";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String recognize(byte[] audioBytes) {
        if (audioBytes == null || audioBytes.length == 0) {
            log.warn("RealAsrAdapter 收到空音频数据");
            return null;
        }

        log.info("RealAsrAdapter 开始识别, 音频大小: {} bytes", audioBytes.length);

        try {
            // 音频转 Base64
            String base64Audio = Base64.getEncoder().encodeToString(audioBytes);

            // 构建请求体 JSON
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("EngSerViceType", ENG_SERVICE_TYPE);
            requestBody.put("SourceType", 1L);
            requestBody.put("VoiceFormat", VOICE_FORMAT);
            requestBody.put("Data", base64Audio);
            requestBody.put("DataLen", (long) audioBytes.length);

            String payload = objectMapper.writeValueAsString(requestBody);
            String action = "SentenceRecognition";

            // 统一时间戳（签名和请求必须用同一个）
            long timestamp = System.currentTimeMillis() / 1000;

            // 生成 TC3-HMAC-SHA256 签名并构造 Authorization
            String authorization = generateAuthorization(payload, action, timestamp);

            // 发送 HTTP POST 请求
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json; charset=utf-8");
            headers.set("Host", ENDPOINT);
            headers.set("X-TC-Action", action);
            headers.set("X-TC-Version", API_VERSION);
            headers.set("X-TC-Timestamp", String.valueOf(timestamp));
            headers.set("Authorization", authorization);

            HttpEntity<String> requestEntity = new HttpEntity<>(payload, headers);

            ResponseEntity<JsonNode> responseEntity = restTemplate.exchange(
                    "https://" + ENDPOINT,
                    HttpMethod.POST,
                    requestEntity,
                    JsonNode.class
            );

            JsonNode responseBody = responseEntity.getBody();
            if (responseBody == null) {
                log.error("RealAsrAdapter 响应体为空");
                return null;
            }

            // 检查是否有错误
            JsonNode errorNode = responseBody.get("Response").get("Error");
            if (errorNode != null && !errorNode.isNull()) {
                String errorCode = errorNode.path("Code").asText("");
                String errorMessage = errorNode.path("Message").asText("");
                log.error("RealAsrAdapter 腾讯云 ASR 返回错误: code={}, message={}", errorCode, errorMessage);
                return null;
            }

            String result = responseBody.path("Response").path("Result").asText();
            String requestId = responseBody.path("Response").path("RequestId").asText("");
            log.info("RealAsrAdapter 识别完成: requestId={}, result={}", requestId, result);
            return result;

        } catch (RestClientException e) {
            log.error("RealAsrAdapter HTTP 调用失败", e);
            return null;
        } catch (Exception e) {
            log.error("RealAsrAdapter 未知异常", e);
            return null;
        }
    }

    /**
     * 生成 TC3-HMAC-SHA256 签名及 Authorization 头（完全按腾讯云 API 3.0 规范）
     * 参考：https://cloud.tencent.com/document/api/1093/37817
     */
    private String generateAuthorization(String payload, String action, long timestamp) throws Exception {
        // 从时间戳提取日期（UTC）
        java.util.Date tsDate = new java.util.Date(timestamp * 1000);
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        String date = sdf.format(tsDate);

        String service = "asr";
        String host = ENDPOINT;
        String algorithm = "TC3-HMAC-SHA256";
        String httpMethod = "POST";
        String canonicalUri = "/";
        String canonicalQueryString = "";
        String contentType = "application/json; charset=utf-8";

        // ---- 步骤 1：拼接规范请求串 ----
        // CanonicalHeaders: 必须小写、字母序排序，每行以 \n 结尾
        String canonicalHeaders = "content-type:" + contentType + "\n"
                + "host:" + host + "\n";
        String signedHeaders = "content-type;host";

        String hashedPayload = sha256Hex(payload);

        String canonicalRequest = httpMethod + "\n"
                + canonicalUri + "\n"
                + canonicalQueryString + "\n"
                + canonicalHeaders + "\n"
                + signedHeaders + "\n"
                + hashedPayload;

        log.debug("canonicalRequest: {}", canonicalRequest);

        // ---- 步骤 2：拼接待签名字符串 ----
        String credentialScope = date + "/" + service + "/tc3_request";
        String hashedCanonicalRequest = sha256Hex(canonicalRequest);

        String stringToSign = algorithm + "\n"
                + timestamp + "\n"
                + credentialScope + "\n"
                + hashedCanonicalRequest;

        log.debug("stringToSign: {}", stringToSign);

        // ---- 步骤 3：计算签名 ----
        byte[] secretDate = hmacSha256(("TC3" + secretKey).getBytes(StandardCharsets.UTF_8), date);
        byte[] secretService = hmacSha256(secretDate, service);
        byte[] secretSigning = hmacSha256(secretService, "tc3_request");
        byte[] signatureBytes = hmacSha256(secretSigning, stringToSign);

        // ---- 步骤 4：拼接 Authorization ----
        String authorization = algorithm + " "
                + "Credential=" + secretId + "/" + credentialScope + ", "
                + "SignedHeaders=" + signedHeaders + ", "
                + "Signature=" + bytesToHex(signatureBytes);

        log.debug("Authorization: {}", authorization);
        return authorization;
    }

    // ======================== 加密工具方法 ========================

    private String sha256Hex(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(digest);
    }

    private byte[] hmacSha256(byte[] key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec spec = new SecretKeySpec(key, "HmacSHA256");
        mac.init(spec);
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }
}
