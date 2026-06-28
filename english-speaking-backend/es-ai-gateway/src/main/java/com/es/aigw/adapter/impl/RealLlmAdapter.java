package com.es.aigw.adapter.impl;

import com.es.aigw.adapter.LlmAdapter;
import com.es.aigw.dto.ChatMessage;
import com.es.aigw.dto.DialogueScoreResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * DeepSeek LLM 适配器（生产环境）
 * 调用 DeepSeek OpenAI 兼容 API（chat/completions）
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "aigw.llm.provider", havingValue = "deepseek")
public class RealLlmAdapter implements LlmAdapter {

    @Value("${aigw.llm.api-key}")
    private String apiKey;

    @Value("${aigw.llm.base-url:https://api.deepseek.com/v1}")
    private String baseUrl;

    /** DeepSeek 模型名称 */
    private static final String MODEL = "deepseek-chat";

    /** 对话评分温度（低温度确保评分稳定） */
    private static final double SCORING_TEMPERATURE = 0.2;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String chat(String systemPrompt, List<ChatMessage> messages, double temperature) {
        log.info("RealLlmAdapter chat 开始, systemPrompt 长度={}, 历史消息数={}, temperature={}",
                systemPrompt != null ? systemPrompt.length() : 0,
                messages != null ? messages.size() : 0,
                temperature);

        if (apiKey == null || apiKey.isBlank()) {
            log.error("RealLlmAdapter API Key 未配置");
            return "抱歉，AI 服务暂时不可用，请稍后再试。";
        }

        String url = baseUrl + "/chat/completions";

        // 构建 messages 数组
        List<Map<String, String>> apiMessages = new ArrayList<>();

        // 系统提示词
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            apiMessages.add(Map.of("role", "system", "content", systemPrompt));
        }

        // 对话历史（映射 role: "ai" → "assistant"，DeepSeek/OpenAI 要求）
        if (messages != null) {
            for (ChatMessage msg : messages) {
                String role = msg.getRole();
                if ("ai".equals(role)) {
                    role = "assistant";
                }
                apiMessages.add(Map.of("role", role, "content", msg.getContent()));
            }
        }

        // 构建请求体
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", MODEL);
        requestBody.put("messages", apiMessages);
        requestBody.put("temperature", temperature);
        requestBody.put("max_tokens", 1024);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JsonNode> responseEntity = restTemplate.exchange(
                    url, HttpMethod.POST, requestEntity, JsonNode.class);

            JsonNode responseBody = responseEntity.getBody();
            if (responseBody == null) {
                log.error("RealLlmAdapter 响应体为空");
                return "抱歉，AI 服务暂时不可用，请稍后再试。";
            }

            String content = responseBody
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content")
                    .asText();

            log.info("RealLlmAdapter chat 完成, 回复长度={}", content != null ? content.length() : 0);
            return content;

        } catch (RestClientException e) {
            log.error("RealLlmAdapter HTTP 调用失败", e);
            return "抱歉，AI 服务暂时不可用，请稍后再试。";
        } catch (Exception e) {
            log.error("RealLlmAdapter 未知异常", e);
            return "抱歉，AI 服务暂时不可用，请稍后再试。";
        }
    }

    @Override
    public DialogueScoreResult scoreDialogue(String dialogueHistory) {
        log.info("RealLlmAdapter scoreDialogue 开始, 对话文本长度={}",
                dialogueHistory != null ? dialogueHistory.length() : 0);

        if (dialogueHistory == null || dialogueHistory.isBlank()) {
            log.warn("RealLlmAdapter scoreDialogue 对话历史为空");
            return buildDefaultScoreResult();
        }

        // 评分专用 System Prompt
        String scoringSystemPrompt = buildScoringSystemPrompt();

        // 构建单条 user 消息（包含待评分的对话历史）
        List<ChatMessage> scoringMessages = List.of(
                new ChatMessage("user", "请对以下英语对话中的**学生表现**进行评分：\n\n" + dialogueHistory)
        );

        String jsonResponse = chat(scoringSystemPrompt, scoringMessages, SCORING_TEMPERATURE);

        if (jsonResponse == null || jsonResponse.isBlank()) {
            log.warn("RealLlmAdapter scoreDialogue 返回空响应");
            return buildDefaultScoreResult();
        }

        try {
            // 从 LLM 回复中提取 JSON（可能包裹在 ```json ``` 中）
            String jsonStr = extractJson(jsonResponse);
            JsonNode root = objectMapper.readTree(jsonStr);

            DialogueScoreResult result = new DialogueScoreResult();
            result.setGrammarScore(parseScore(root, "grammarScore"));
            result.setRelevanceScore(parseScore(root, "relevanceScore"));
            result.setFluencyScore(parseScore(root, "fluencyScore"));

            // 计算总分
            BigDecimal total = BigDecimal.valueOf(
                    (result.getGrammarScore().doubleValue()
                            + result.getRelevanceScore().doubleValue()
                            + result.getFluencyScore().doubleValue()) / 3.0
            ).setScale(1, RoundingMode.HALF_UP);
            result.setTotalScore(total);

            // 评语
            String comment = root.has("comment") ? root.get("comment").asText() : "";
            result.setComment(comment);

            log.info("RealLlmAdapter scoreDialogue 完成: grammar={}, relevance={}, fluency={}, total={}",
                    result.getGrammarScore(), result.getRelevanceScore(),
                    result.getFluencyScore(), result.getTotalScore());
            return result;

        } catch (Exception e) {
            log.error("RealLlmAdapter scoreDialogue JSON 解析失败: response={}", jsonResponse, e);
            return buildDefaultScoreResult();
        }
    }

    // ======================== 私有方法 ========================

    /** 构建评分专用 System Prompt */
    private String buildScoringSystemPrompt() {
        return """
                你是一名英语口语评估专家。请根据下面的英语对话，评估**学生的口语表现**。

                请从以下三个维度评分（每项 0-100 分）：
                1. grammarScore（语法准确度）：语法结构是否正确，时态、主谓一致等
                2. relevanceScore（内容相关性）：回答是否切题、逻辑是否连贯
                3. fluencyScore（流利度）：表达是否自然流畅（根据文本连贯性判断）

                请综合计算 totalScore（三项平均）。

                请用中文写一段简短、鼓励性的评语（comment），指出亮点和可改进之处。

                请只返回 JSON，不要包含任何其他文字：
                {
                  "grammarScore": 数字,
                  "relevanceScore": 数字,
                  "fluencyScore": 数字,
                  "totalScore": 数字,
                  "comment": "评语"
                }""";
    }

    /** 从 LLM 回复中提取 JSON 字符串（处理 ```json ... ``` 包裹） */
    private String extractJson(String raw) {
        String trimmed = raw.trim();
        // 去掉 Markdown 代码块标记
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf("\n");
            if (start == -1) start = 3;
            else start = start + 1;
            int end = trimmed.lastIndexOf("```");
            if (end > start) {
                trimmed = trimmed.substring(start, end).trim();
            } else {
                trimmed = trimmed.substring(start).trim();
            }
        }
        return trimmed;
    }

    /** 安全解析分数字段 */
    private BigDecimal parseScore(JsonNode root, String fieldName) {
        JsonNode node = root.get(fieldName);
        if (node == null || node.isNull()) {
            return BigDecimal.ZERO;
        }
        if (node.isNumber()) {
            return BigDecimal.valueOf(node.asDouble()).setScale(1, RoundingMode.HALF_UP);
        }
        if (node.isTextual()) {
            try {
                return new BigDecimal(node.asText()).setScale(1, RoundingMode.HALF_UP);
            } catch (NumberFormatException e) {
                return BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }

    /** 构建默认评分结果（兜底） */
    private DialogueScoreResult buildDefaultScoreResult() {
        DialogueScoreResult result = new DialogueScoreResult();
        result.setGrammarScore(BigDecimal.valueOf(70));
        result.setRelevanceScore(BigDecimal.valueOf(70));
        result.setFluencyScore(BigDecimal.valueOf(70));
        result.setTotalScore(BigDecimal.valueOf(70));
        result.setComment("评分服务暂时遇到问题，已为您生成默认评分。请稍后再试。");
        return result;
    }
}
