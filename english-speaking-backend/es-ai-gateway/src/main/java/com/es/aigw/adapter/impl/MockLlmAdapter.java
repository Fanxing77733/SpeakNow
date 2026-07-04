package com.es.aigw.adapter.impl;

import com.es.aigw.adapter.LlmAdapter;
import com.es.aigw.dto.ChatMessage;
import com.es.aigw.dto.DialogueScoreResult;
import com.es.aigw.dto.GrammarErrorItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
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
        int vocabulary = 65 + random.nextInt(26);   // 65-90
        int pronunciation = 65 + random.nextInt(26); // 65-90
        int interaction = 60 + random.nextInt(31);   // 60-90
        int total = (grammar + relevance + fluency + vocabulary + pronunciation + interaction) / 6;

        DialogueScoreResult result = new DialogueScoreResult();
        result.setGrammarScore(new BigDecimal(grammar));
        result.setRelevanceScore(new BigDecimal(relevance));
        result.setFluencyScore(new BigDecimal(fluency));
        result.setTotalScore(new BigDecimal(total));
        result.setVocabularyScore(new BigDecimal(vocabulary));
        result.setPronunciationScore(new BigDecimal(pronunciation));
        result.setInteractionScore(new BigDecimal(interaction));
        result.setLevelLabel(getDialogLevelLabel(total));
        result.setComment(generateDialogComment(total, grammar, fluency));
        result.setStrengths(generateDialogStrengths(grammar, relevance, fluency, vocabulary, pronunciation, interaction));
        result.setWeaknesses(generateDialogWeaknesses(grammar, relevance, fluency, vocabulary, pronunciation, interaction));
        result.setGrammarErrors(generateMockGrammarErrors(grammar));
        result.setSuggestedExpressions(generateMockExpressions(total));

        log.info("Mock LLM scoreDialogue 完成: grammar={}, relevance={}, fluency={}, vocab={}, pron={}, interact={}, total={}",
                grammar, relevance, fluency, vocabulary, pronunciation, interaction, total);
        return result;
    }

    // ======================== 对话评分 Mock 数据生成 ========================

    private String getDialogLevelLabel(int total) {
        if (total >= 90) return "对话大师";
        if (total >= 80) return "沟通达人";
        if (total >= 70) return "对话进阶者";
        if (total >= 60) return "对话学习者";
        return "对话新星";
    }

    private String generateDialogComment(int total, int grammar, int fluency) {
        if (total >= 90) {
            return "非常出色！你的英语对话能力很强，语法准确、表达流畅、用词丰富。"
                + "对话中展现了良好的互动能力，能够自然地推进话题。继续保持这个水平！";
        } else if (total >= 80) {
            return "表现不错！你能够自信地进行英语对话，整体沟通顺畅。"
                + "建议在词汇多样性上再多积累，同时注意个别语法细节（如时态一致性），让表达更精准。";
        } else if (total >= 70) {
            return "有进步空间！已能完成基本的英语对话，但在流利度和词汇量上还可以提升。"
                + "建议多练习常用句型，积累地道的表达方式，同时注意回答的完整性和相关性。";
        } else if (total >= 60) {
            return "继续加油！你正在建立英语对话的基础。建议从简单短句开始，"
                + "多听多模仿地道的对话，逐步扩大词汇量，提升回答的流畅度。";
        } else {
            return "别灰心！开口说英语本身就是很大的进步。建议从最基本的日常对话开始，"
                + "学习常用短语和句型，每次专注练习 1-2 个话题，慢慢积累信心。";
        }
    }

    private List<String> generateDialogStrengths(int grammar, int relevance, int fluency, int vocab, int pron, int interact) {
        List<String> strengths = new ArrayList<>();
        int[] scores = {grammar, relevance, fluency, vocab, pron, interact};
        String[] labels = {"语法结构准确", "回答切题相关", "表达流畅自然", "词汇丰富多样", "发音清晰准确", "互动积极自然"};
        for (int i = 0; i < scores.length; i++) {
            if (scores[i] >= 80) {
                strengths.add(labels[i] + "（" + scores[i] + "分）");
            }
        }
        if (strengths.isEmpty()) {
            strengths.add("敢于开口对话的勇气值得肯定");
        }
        return strengths;
    }

    private List<String> generateDialogWeaknesses(int grammar, int relevance, int fluency, int vocab, int pron, int interact) {
        List<String> weaknesses = new ArrayList<>();
        int[] scores = {grammar, relevance, fluency, vocab, pron, interact};
        String[] labels = {"语法准确度", "内容相关性", "表达流利度", "词汇丰富度", "发音清晰度", "互动自然度"};
        String[] tips = {
            "注意时态一致性和主谓一致，回答前稍作思考再开口",
            "回答问题时要紧扣话题，避免跑题或过于简略",
            "多练习常用句型，减少犹豫停顿，提高表达连贯性",
            "建议每次对话后记录新学词汇，逐步扩大词汇量",
            "多注意元音发音和单词重音，模仿原声语调",
            "尝试主动追问和延伸话题，不要只被动回答问题"
        };
        for (int i = 0; i < scores.length; i++) {
            if (scores[i] < 80) {
                weaknesses.add(labels[i] + "（" + scores[i] + "分），" + tips[i]);
            }
        }
        if (weaknesses.isEmpty()) {
            weaknesses.add("可以尝试更复杂的话题和更长的对话轮次");
        }
        return weaknesses;
    }

    private List<GrammarErrorItem> generateMockGrammarErrors(int grammarScore) {
        if (grammarScore >= 85) return List.of();
        List<GrammarErrorItem> errors = new ArrayList<>();
        if (grammarScore < 85) {
            errors.add(new GrammarErrorItem("I go to school yesterday", "I went to school yesterday",
                "一般过去时应使用过去式 went，而不是原形 go"));
        }
        if (grammarScore < 75) {
            errors.add(new GrammarErrorItem("He don't like it", "He doesn't like it",
                "第三人称单数应使用 doesn't，而不是 don't"));
        }
        if (grammarScore < 65) {
            errors.add(new GrammarErrorItem("I have eat breakfast", "I have eaten breakfast",
                "现在完成时应使用过去分词 eaten，而不是原形 eat"));
        }
        return errors;
    }

    private List<String> generateMockExpressions(int total) {
        if (total >= 85) {
            return List.of(
                "I couldn't agree more — 表示非常赞同",
                "That's a good point, and I'd add that... — 补充观点",
                "It's worth mentioning that... — 引出值得注意的点"
            );
        } else if (total >= 70) {
            return List.of(
                "In my opinion, ... — 表达个人观点",
                "Could you tell me more about...? — 追问细节",
                "That sounds interesting! — 回应对方"
            );
        } else {
            return List.of(
                "I think... / I feel... — 表达想法",
                "Could you repeat that? — 请求重复",
                "What does ... mean? — 询问含义"
            );
        }
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

    @Override
    public String checkGrammar(String text) {
        log.info("Mock LLM 语法纠错开始, 文本长度={}", text != null ? text.length() : 0);
        try {
            Thread.sleep(400 + random.nextInt(301));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // 模拟检测常见错误并返回纠错 JSON
        String json;
        String lower = text.toLowerCase();
        if (lower.contains("go to school yesterday") || lower.contains("go yesterday")) {
            json = "{\"corrections\":[{\"original\":\"He go to school yesterday.\",\"corrected\":\"He went to school yesterday.\",\"error_type\":\"grammar\",\"explanation\":\"在一般过去时中，go的过去式应为went。\"}]}";
        } else if (lower.contains("i is") || lower.contains("he are") || lower.contains("they is")) {
            json = "{\"corrections\":[{\"original\":\""
                    + escapeJson(text) + "\",\"corrected\":\""
                    + escapeJson(text.replaceAll("(?i)i is", "I am").replaceAll("(?i)he are", "he is").replaceAll("(?i)they is", "they are"))
                    + "\",\"error_type\":\"grammar\",\"explanation\":\"主谓一致错误，主语和谓语be动词应在人称和数上保持一致。\"}]}";
        } else {
            // 无明显错误，返回空 corrections
            json = "{\"corrections\":[]}";
        }

        log.info("Mock 语法纠错完成");
        return json;
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
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
