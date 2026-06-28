package com.es.aigw.adapter.impl;

import com.es.aigw.adapter.LlmAdapter;
import com.es.aigw.dto.ChatMessage;
import com.es.aigw.dto.DialogueScoreResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;

/**
 * LLM 适配器 Mock 实现（开发环境专用）
 * 根据场景返回对应的英文回复，模拟对话和评分
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "aigw.llm.provider", havingValue = "mock", matchIfMissing = true)
public class MockLlmAdapter implements LlmAdapter {

    private final Random random = new Random();

    @Override
    public String chat(String systemPrompt, List<ChatMessage> messages, double temperature) {
        log.info("Mock LLM chat 开始, systemPrompt 长度={}, 历史消息数={}, temperature={}",
                systemPrompt != null ? systemPrompt.length() : 0,
                messages != null ? messages.size() : 0,
                temperature);

        // 模拟 500-1000ms 延时
        try {
            Thread.sleep(500 + random.nextInt(501));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Mock LLM 延时被中断");
        }

        String reply;
        int historySize = (messages != null) ? messages.size() : 0;

        if (historySize == 0) {
            // 第一轮消息 — 根据场景 Prompt 返回不同的开场白
            reply = generateOpeningMessage(systemPrompt);
        } else {
            // 后续轮次 — 根据最后一条用户消息简单续接
            String lastUserContent = getLastUserContent(messages);
            reply = generateFollowUp(lastUserContent);
        }

        log.info("Mock LLM chat 完成: {}", reply);
        return reply;
    }

    @Override
    public DialogueScoreResult scoreDialogue(String dialogueHistory) {
        log.info("Mock LLM scoreDialogue 开始, 对话文本长度={}",
                dialogueHistory != null ? dialogueHistory.length() : 0);

        // 模拟 500-1000ms 延时
        try {
            Thread.sleep(500 + random.nextInt(501));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Mock LLM 评分延时被中断");
        }

        int grammar = 70 + random.nextInt(21);    // 70-90
        int relevance = 65 + random.nextInt(26);   // 65-90
        int fluency = 70 + random.nextInt(26);     // 70-95
        int total = (grammar + relevance + fluency) / 3;

        DialogueScoreResult result = new DialogueScoreResult();
        result.setGrammarScore(new BigDecimal(grammar));
        result.setRelevanceScore(new BigDecimal(relevance));
        result.setFluencyScore(new BigDecimal(fluency));
        result.setTotalScore(new BigDecimal(total));
        result.setComment("Good job! Your grammar is solid, and you stayed on topic well. "
                + "Try to speak more fluently by practicing common phrases and reducing pauses. "
                + "Keep practicing and you will see great improvement!");

        log.info("Mock LLM scoreDialogue 完成: grammar={}, relevance={}, fluency={}, total={}",
                grammar, relevance, fluency, total);
        return result;
    }

    // ======================== 私有方法 ========================

    /** 根据场景提示词生成开场白 */
    private String generateOpeningMessage(String systemPrompt) {
        if (systemPrompt == null) {
            return "Hello! How can I help you today?";
        }
        String lower = systemPrompt.toLowerCase();
        if (lower.contains("self-introduction") || lower.contains("self_intro")) {
            return "Hello! I'm Alex. Nice to meet you. Can you tell me about yourself?";
        } else if (lower.contains("campus")) {
            return "What subjects do you like most at school? I'm really into science.";
        } else if (lower.contains("restaurant")) {
            return "Welcome to our restaurant! What would you like to order today?";
        }
        return "Hello! How can I help you today?";
    }

    /** 根据用户最后一条消息生成后续回复 */
    private String generateFollowUp(String userContent) {
        if (userContent == null || userContent.isBlank()) {
            return "That's interesting! Can you tell me more about that?";
        }
        String lower = userContent.toLowerCase();

        if (lower.contains("name") || lower.contains("call") || lower.contains("i'm ") || lower.contains("i am ")) {
            return "That's a nice name! Where are you from?";
        } else if (lower.contains("from") || lower.contains("live in") || lower.contains("city")) {
            return "That sounds like a great place! What do you like most about living there?";
        } else if (lower.contains("stud") || lower.contains("school") || lower.contains("subject")
                || lower.contains("class") || lower.contains("course") || lower.contains("teacher")) {
            return "That sounds like a great subject! What do you enjoy most about it?";
        } else if (lower.contains("food") || lower.contains("order") || lower.contains("menu")
                || lower.contains("eat") || lower.contains("drink") || lower.contains("dish")) {
            return "Great choice! Would you like anything else to go with that?";
        } else if (lower.contains("like") || lower.contains("enjoy") || lower.contains("love")
                || lower.contains("hobby") || lower.contains("interest")) {
            return "That sounds wonderful! How long have you been interested in that?";
        } else if (lower.contains("work") || lower.contains("job") || lower.contains("career")) {
            return "That's interesting! What do you find most challenging about your work?";
        } else if (lower.contains("family") || lower.contains("parent") || lower.contains("brother")
                || lower.contains("sister")) {
            return "Family is important! Do you spend a lot of time together?";
        } else if (lower.contains("weekend") || lower.contains("free time") || lower.contains("spare time")) {
            return "That sounds like a fun way to spend your time! Do you do that often?";
        } else if (lower.contains("movie") || lower.contains("music") || lower.contains("book")
                || lower.contains("sport") || lower.contains("game")) {
            return "That's a popular choice! What's your favorite one?";
        } else if (lower.contains("weather") || lower.contains("season") || lower.contains("summer")
                || lower.contains("winter")) {
            return "The weather can really affect our mood! What's your favorite season and why?";
        } else if (lower.contains("yes") || lower.contains("yeah") || lower.contains("sure")) {
            return "Great! Can you tell me more specifically what you're looking for?";
        } else if (lower.contains("no") || lower.contains("not really") || lower.contains("don't")) {
            return "I understand. Is there something else you'd prefer to talk about?";
        } else if (userContent.length() < 20) {
            return "Could you tell me a bit more about that? I'd love to hear the details.";
        } else {
            return "I see! That's really interesting. Can you tell me more about your experience?";
        }
    }

    /** 从对话历史中获取最后一条用户消息 */
    private String getLastUserContent(List<ChatMessage> messages) {
        for (int i = messages.size() - 1; i >= 0; i--) {
            if ("user".equals(messages.get(i).getRole())) {
                return messages.get(i).getContent();
            }
        }
        return null;
    }
}
