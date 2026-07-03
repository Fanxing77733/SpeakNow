package com.es.support.rag;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.support.entity.FaqEntry;
import com.es.support.mapper.FaqEntryMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * RAG 知识检索器
 * V1 使用 MySQL LIKE 关键词匹配，后续可升级为 embedding 向量检索
 */
@Slf4j
@Component
public class RAGRetriever {

    private final FaqEntryMapper faqEntryMapper;

    public RAGRetriever(FaqEntryMapper faqEntryMapper) {
        this.faqEntryMapper = faqEntryMapper;
    }

    /**
     * 从 FAQ 知识库检索相关文档片段
     * @param query 用户问题
     * @param topK 返回前 K 条最相关结果
     * @return 相关 FAQ 条目列表
     */
    public List<FaqEntry> retrieve(String query, int topK) {
        // 1. 提取关键词（简单分词：按空格和常见分隔符拆分）
        List<String> keywords = extractKeywords(query);

        // 2. 对每个关键词做 LIKE 搜索
        Set<FaqEntry> results = new LinkedHashSet<>();
        for (String keyword : keywords) {
            if (keyword.length() < 2) continue;
            List<FaqEntry> matches = faqEntryMapper.selectList(
                new LambdaQueryWrapper<FaqEntry>()
                    .eq(FaqEntry::getIsPublished, 1)
                    .and(w -> w.like(FaqEntry::getQuestion, keyword)
                              .or()
                              .like(FaqEntry::getAnswer, keyword))
                    .orderByDesc(FaqEntry::getClickCount)
                    .last("LIMIT " + topK)
            );
            results.addAll(matches);
        }

        // 3. 如果关键词匹配太少，用全量 LIKE 搜索
        if (results.size() < 2) {
            List<FaqEntry> fallback = faqEntryMapper.selectList(
                new LambdaQueryWrapper<FaqEntry>()
                    .eq(FaqEntry::getIsPublished, 1)
                    .and(w -> w.like(FaqEntry::getQuestion, query)
                              .or()
                              .like(FaqEntry::getAnswer, query))
                    .orderByDesc(FaqEntry::getClickCount)
                    .last("LIMIT " + topK)
            );
            results.addAll(fallback);
        }

        return results.stream().limit(topK).collect(Collectors.toList());
    }

    /**
     * 将检索到的文档拼接为 LLM 上下文
     */
    public String buildContext(List<FaqEntry> docs) {
        if (docs == null || docs.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        sb.append("以下是知识库中与用户问题相关的参考信息：\n\n");
        for (int i = 0; i < docs.size(); i++) {
            FaqEntry doc = docs.get(i);
            sb.append("【文档").append(i + 1).append("】\n");
            sb.append("问题：").append(doc.getQuestion()).append("\n");
            sb.append("答案：").append(doc.getAnswer()).append("\n\n");
        }
        return sb.toString();
    }

    private List<String> extractKeywords(String query) {
        if (query == null || query.isEmpty()) return Collections.emptyList();

        // 检测是否包含中文
        boolean hasChinese = query.chars().anyMatch(c -> Character.UnicodeScript.of(c) == Character.UnicodeScript.HAN);

        if (hasChinese) {
            // 中文：按 bigram（2 字词组）拆分，提高匹配率
            // "怎么注册账号" → ["怎么", "么注", "注册", "册账", "账号"]
            List<String> bigrams = new ArrayList<>();
            String cleaned = query.replaceAll("[\\s，,。.！!？?、；;：:\\n]+", "");
            for (int i = 0; i < cleaned.length() - 1; i++) {
                bigrams.add(cleaned.substring(i, i + 2));
            }
            if (cleaned.length() == 1) {
                bigrams.add(cleaned);
            }
            // 去重
            return bigrams.stream().distinct().collect(Collectors.toList());
        }

        // 英文：按空格和标点拆分
        String[] parts = query.split("[\\s，,。.！!？?、；;：:\\n]+");
        return Arrays.stream(parts)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
    }
}
