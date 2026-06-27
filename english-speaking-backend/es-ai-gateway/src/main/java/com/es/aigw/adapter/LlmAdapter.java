package com.es.aigw.adapter;

import com.es.aigw.dto.ChatMessage;
import com.es.aigw.dto.DialogueScoreResult;

import java.util.List;

/**
 * 大语言模型（LLM）适配器接口
 * 各供应商实现：DeepSeek、通义千问、OpenAI 等
 */
public interface LlmAdapter {

    /**
     * 对话生成
     * @param systemPrompt 系统提示词（定义角色、场景、难度）
     * @param messages 对话历史，每项包含 role(user/assistant) + content
     * @param temperature 温度参数（控制随机性，0.0-2.0）
     * @return LLM 生成的回复文本
     */
    String chat(String systemPrompt, List<ChatMessage> messages, double temperature);

    /**
     * 对话评分（独立调用，温度 0.1-0.3 确保评分稳定）
     * @param dialogueHistory 完整对话文本，格式："User: xxx\nAI: xxx\nUser: xxx\n..."
     * @return 评分结果（语法/相关性/流利度 + 文字评语）
     */
    DialogueScoreResult scoreDialogue(String dialogueHistory);
}
