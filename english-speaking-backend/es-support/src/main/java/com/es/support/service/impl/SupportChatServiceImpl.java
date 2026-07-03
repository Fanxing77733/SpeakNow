package com.es.support.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.aigw.adapter.LlmAdapter;
import com.es.aigw.dto.ChatMessage;
import com.es.common.exception.BusinessException;
import com.es.support.dto.ChatHistoryVO;
import com.es.support.dto.SupportChatResp;
import com.es.support.entity.FaqEntry;
import com.es.support.entity.SupportChatMessage;
import com.es.support.entity.SupportChatSession;
import com.es.support.entity.SupportTicket;
import com.es.support.mapper.SupportChatMessageMapper;
import com.es.support.mapper.SupportChatSessionMapper;
import com.es.support.mapper.SupportTicketMapper;
import com.es.support.rag.RAGRetriever;
import com.es.support.service.SupportChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SupportChatServiceImpl implements SupportChatService {

    private static final String SYSTEM_PROMPT =
        "你是一个英语口语训练系统的智能客服助手。请严格遵循以下规则：\n" +
        "1. 仅基于提供的参考文档回答问题，不要编造信息\n" +
        "2. 如果参考文档中没有相关信息，请诚实地说'这个问题我不太确定，建议联系人工客服'\n" +
        "3. 回答要简洁友好，使用中文回复\n" +
        "4. 在回答末尾用方括号标注置信度，格式：[置信度: 高/中/低]\n" +
        "5. 如果用户问的是操作类问题，给出具体的步骤指导";

    private final SupportChatSessionMapper sessionMapper;
    private final SupportChatMessageMapper messageMapper;
    private final SupportTicketMapper ticketMapper;
    private final RAGRetriever ragRetriever;
    private final LlmAdapter llmAdapter;

    public SupportChatServiceImpl(SupportChatSessionMapper sessionMapper,
                                  SupportChatMessageMapper messageMapper,
                                  SupportTicketMapper ticketMapper,
                                  RAGRetriever ragRetriever,
                                  LlmAdapter llmAdapter) {
        this.sessionMapper = sessionMapper;
        this.messageMapper = messageMapper;
        this.ticketMapper = ticketMapper;
        this.ragRetriever = ragRetriever;
        this.llmAdapter = llmAdapter;
    }

    @Override
    @Transactional
    public SupportChatResp chat(Long userId, String message, Long sessionId) {
        try {
            return doChat(userId, message, sessionId);
        } catch (Exception e) {
            log.error("客服对话异常: userId={}, message={}", userId, message, e);
            return SupportChatResp.builder()
                .sessionId(sessionId != null ? sessionId : 0L)
                .message("抱歉，服务暂时不可用，请稍后重试。您可以浏览左侧 FAQ 寻找答案。")
                .confidence(java.math.BigDecimal.ZERO)
                .isEscalated(true)
                .build();
        }
    }

    private SupportChatResp doChat(Long userId, String message, Long sessionId) {
        // 1. 获取或创建会话
        SupportChatSession session;
        if (sessionId != null) {
            session = sessionMapper.selectById(sessionId);
            if (session == null || !session.getUserId().equals(userId)) {
                throw new BusinessException(404, "会话不存在");
            }
        } else {
            session = new SupportChatSession();
            session.setUserId(userId);
            session.setStatus("ACTIVE");
            sessionMapper.insert(session);
        }

        // 2. 保存用户消息
        SupportChatMessage userMsg = new SupportChatMessage();
        userMsg.setSessionId(session.getId());
        userMsg.setRole("USER");
        userMsg.setContent(message);
        messageMapper.insert(userMsg);

        // 3. RAG 检索
        List<FaqEntry> docs = ragRetriever.retrieve(message, 5);
        String context = ragRetriever.buildContext(docs);

        // 4. 构建对话历史作为 LLM 输入
        List<ChatMessage> llmMessages = buildLLMHistory(session.getId(), message);

        // 5. 构建带上下文的 system prompt
        String systemPrompt = SYSTEM_PROMPT;
        if (!context.isEmpty()) {
            systemPrompt += "\n\n" + context;
        }

        // 6. 调用 LLM
        String llmResponse;
        BigDecimal confidence;
        try {
            llmResponse = llmAdapter.chat(systemPrompt, llmMessages, 0.3);
            confidence = extractConfidence(llmResponse);
            // 清理回答中的置信度标记
            llmResponse = cleanResponse(llmResponse);
        } catch (Exception e) {
            log.error("LLM 客服调用失败", e);
            llmResponse = "服务繁忙，请稍后再试。如需帮助，可以浏览左侧 FAQ 或联系人工客服。";
            confidence = BigDecimal.ZERO;
        }

        // 7. 保存 AI 消息
        SupportChatMessage aiMsg = new SupportChatMessage();
        aiMsg.setSessionId(session.getId());
        aiMsg.setRole("AI");
        aiMsg.setContent(llmResponse);
        aiMsg.setConfidence(confidence);
        messageMapper.insert(aiMsg);

        // 8. 低置信度时创建工单
        boolean escalated = false;
        Long ticketId = null;
        if (confidence.compareTo(new BigDecimal("0.5")) < 0) {
            SupportTicket ticket = new SupportTicket();
            ticket.setSessionId(session.getId());
            ticket.setUserId(userId);
            ticket.setQuestion(message);
            ticket.setStatus("PENDING");
            ticketMapper.insert(ticket);
            ticketId = ticket.getId();
            escalated = true;
            session.setStatus("ESCALATED");
            sessionMapper.updateById(session);
        }

        return SupportChatResp.builder()
            .sessionId(session.getId())
            .message(llmResponse)
            .confidence(confidence)
            .isEscalated(escalated)
            .ticketId(ticketId)
            .build();
    }

    @Override
    public ChatHistoryVO getHistory(Long userId, Long sessionId) {
        SupportChatSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(404, "会话不存在");
        }

        List<SupportChatMessage> msgs = messageMapper.selectList(
            new LambdaQueryWrapper<SupportChatMessage>()
                .eq(SupportChatMessage::getSessionId, sessionId)
                .orderByAsc(SupportChatMessage::getCreatedAt)
        );

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        List<ChatHistoryVO.MessageItem> items = msgs.stream().map(m ->
            ChatHistoryVO.MessageItem.builder()
                .role(m.getRole())
                .content(m.getContent())
                .confidence(m.getConfidence())
                .createdAt(m.getCreatedAt() != null ? m.getCreatedAt().format(fmt) : null)
                .build()
        ).collect(Collectors.toList());

        return ChatHistoryVO.builder()
            .sessionId(session.getId())
            .status(session.getStatus())
            .satisfaction(session.getSatisfaction())
            .messages(items)
            .build();
    }

    @Override
    @Transactional
    public void submitFeedback(Long sessionId, int rating) {
        SupportChatSession session = sessionMapper.selectById(sessionId);
        if (session == null) throw new BusinessException(404, "会话不存在");
        session.setSatisfaction(rating);
        sessionMapper.updateById(session);
        log.info("客服满意度反馈: sessionId={}, rating={}", sessionId, rating);
    }

    @Override
    @Transactional
    public Long createTicket(Long userId, Long sessionId) {
        SupportChatSession session = sessionMapper.selectById(sessionId);
        if (session == null) throw new BusinessException(404, "会话不存在");

        // 获取用户最后一个问题
        List<SupportChatMessage> msgs = messageMapper.selectList(
            new LambdaQueryWrapper<SupportChatMessage>()
                .eq(SupportChatMessage::getSessionId, sessionId)
                .eq(SupportChatMessage::getRole, "USER")
                .orderByDesc(SupportChatMessage::getCreatedAt)
                .last("LIMIT 1")
        );
        String question = msgs.isEmpty() ? "用户请求人工客服" : msgs.get(0).getContent();

        SupportTicket ticket = new SupportTicket();
        ticket.setSessionId(sessionId);
        ticket.setUserId(userId);
        ticket.setQuestion(question);
        ticket.setStatus("PENDING");
        ticketMapper.insert(ticket);

        session.setStatus("ESCALATED");
        sessionMapper.updateById(session);

        log.info("人工工单已创建: ticketId={}, userId={}", ticket.getId(), userId);
        return ticket.getId();
    }

    private List<ChatMessage> buildLLMHistory(Long sessionId, String currentMsg) {
        // 获取最近 10 条历史消息
        List<SupportChatMessage> history = messageMapper.selectList(
            new LambdaQueryWrapper<SupportChatMessage>()
                .eq(SupportChatMessage::getSessionId, sessionId)
                .orderByDesc(SupportChatMessage::getCreatedAt)
                .last("LIMIT 10")
        );

        List<ChatMessage> llmMsgs = new ArrayList<>();
        // 反转以得到时间顺序
        for (int i = history.size() - 1; i >= 0; i--) {
            SupportChatMessage msg = history.get(i);
            String role = "USER".equals(msg.getRole()) ? "user" : "assistant";
            llmMsgs.add(new ChatMessage(role, msg.getContent()));
        }
        return llmMsgs;
    }

    private BigDecimal extractConfidence(String response) {
        if (response == null) return new BigDecimal("0.5");
        if (response.contains("置信度: 高") || response.contains("置信度：高")) return new BigDecimal("0.9");
        if (response.contains("置信度: 中") || response.contains("置信度：中")) return new BigDecimal("0.7");
        if (response.contains("置信度: 低") || response.contains("置信度：低")) return new BigDecimal("0.4");
        return new BigDecimal("0.6");
    }

    private String cleanResponse(String response) {
        if (response == null) return "";
        return response.replaceAll("\\[置信度[:：]\\s*[高中低]\\]", "").trim();
    }
}
