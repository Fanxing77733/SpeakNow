package com.es.practice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.aigw.adapter.LlmAdapter;
import com.es.common.exception.BusinessException;
import com.es.practice.dto.CorrectionVO;
import com.es.practice.dto.GrammarCheckResultVO;
import com.es.practice.entity.GrammarErrorBook;
import com.es.practice.mapper.GrammarErrorBookMapper;
import com.es.practice.service.GrammarService;
import com.es.practice.util.InputFilter;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 语法纠错服务实现（V2.0）
 */
@Slf4j
@Service
public class GrammarServiceImpl implements GrammarService {

    private final LlmAdapter llmAdapter;
    private final GrammarErrorBookMapper errorBookMapper;
    private final InputFilter inputFilter;
    private final ObjectMapper objectMapper;

    public GrammarServiceImpl(LlmAdapter llmAdapter,
                               GrammarErrorBookMapper errorBookMapper,
                               InputFilter inputFilter,
                               ObjectMapper objectMapper) {
        this.llmAdapter = llmAdapter;
        this.errorBookMapper = errorBookMapper;
        this.inputFilter = inputFilter;
        this.objectMapper = objectMapper;
    }

    @Override
    public GrammarCheckResultVO check(Long userId, String text, String inputType) {
        // 1. 输入过滤（长度截断+敏感词）
        String filtered = inputFilter.filter(text);
        if (filtered.isBlank()) {
            throw new BusinessException(400, "请输入要纠错的英文文本");
        }

        // 2. 调用 LLM 语法纠错（独立 Prompt, T=0.1）
        String llmResult;
        try {
            llmResult = llmAdapter.checkGrammar(filtered);
        } catch (Exception e) {
            log.error("LLM 语法纠错失败: userId={}", userId, e);
            throw new BusinessException(503, "服务繁忙，请稍后重试");
        }

        // 3. 解析 LLM 返回的 JSON
        List<CorrectionVO> corrections = parseGrammarResult(llmResult);
        if (corrections.isEmpty()) {
            CorrectionVO noError = new CorrectionVO();
            noError.setOriginalText(filtered);
            noError.setCorrectedText(filtered);
            noError.setErrorType("none");
            noError.setExplanation("未检测到明显的语法或拼写错误，文本看起来不错！");
            corrections.add(noError);
        }

        GrammarCheckResultVO result = new GrammarCheckResultVO();
        result.setCorrections(corrections);
        result.setResultId(UUID.randomUUID().toString());
        return result;
    }

    @Override
    @Transactional
    public void saveToBook(Long userId, CorrectionVO item) {
        GrammarErrorBook book = new GrammarErrorBook();
        book.setUserId(userId);
        book.setOriginalText(item.getOriginalText());
        book.setCorrectedText(item.getCorrectedText());
        book.setErrorType(item.getErrorType());
        book.setExplanation(item.getExplanation());
        book.setSource("manual");
        book.setCreatedAt(LocalDateTime.now());
        errorBookMapper.insert(book);
        log.info("语法错题已收藏: userId={}, errorType={}", userId, item.getErrorType());
    }

    @Override
    public List<CorrectionVO> getErrorBook(Long userId, String errorType) {
        LambdaQueryWrapper<GrammarErrorBook> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GrammarErrorBook::getUserId, userId);
        if (errorType != null && !errorType.isBlank()) {
            wrapper.eq(GrammarErrorBook::getErrorType, errorType);
        }
        wrapper.orderByDesc(GrammarErrorBook::getCreatedAt);

        return errorBookMapper.selectList(wrapper).stream().map(entity -> {
            CorrectionVO vo = new CorrectionVO();
            vo.setOriginalText(entity.getOriginalText());
            vo.setCorrectedText(entity.getCorrectedText());
            vo.setErrorType(entity.getErrorType());
            vo.setExplanation(entity.getExplanation());
            return vo;
        }).toList();
    }

    /** 解析 LLM 返回的语法纠错 JSON */
    @SuppressWarnings("unchecked")
    private List<CorrectionVO> parseGrammarResult(String llmResult) {
        List<CorrectionVO> corrections = new ArrayList<>();
        try {
            // 尝试从 LLM 返回中提取 JSON
            String json = extractJson(llmResult);
            Map<String, Object> map = objectMapper.readValue(json,
                    new TypeReference<Map<String, Object>>() {});
            if (map.containsKey("corrections")) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) map.get("corrections");
                for (Map<String, Object> item : list) {
                    CorrectionVO vo = new CorrectionVO();
                    vo.setOriginalText(String.valueOf(item.getOrDefault("original", "")));
                    vo.setCorrectedText(String.valueOf(item.getOrDefault("corrected", "")));
                    vo.setErrorType(String.valueOf(item.getOrDefault("error_type", "grammar")));
                    vo.setExplanation(String.valueOf(item.getOrDefault("explanation", "")));
                    corrections.add(vo);
                }
            }
        } catch (Exception e) {
            log.warn("解析语法纠错 JSON 失败，使用原始返回: {}", llmResult, e);
            // JSON 解析失败时，将原始返回作为兜底
            CorrectionVO fallback = new CorrectionVO();
            fallback.setOriginalText("（解析失败）");
            fallback.setCorrectedText(llmResult);
            fallback.setErrorType("grammar");
            fallback.setExplanation("AI 返回的原始结果，请参考");
            corrections.add(fallback);
        }
        return corrections;
    }

    /** 从 LLM 返回中提取 JSON 部分 */
    private String extractJson(String raw) {
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return raw.substring(start, end + 1);
        }
        return raw;
    }
}
