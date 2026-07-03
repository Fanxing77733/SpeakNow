package com.es.support.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.common.exception.BusinessException;
import com.es.support.dto.FaqEntryVO;
import com.es.support.entity.FaqEntry;
import com.es.support.mapper.FaqEntryMapper;
import com.es.support.service.FaqService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class FaqServiceImpl implements FaqService {

    private final FaqEntryMapper faqEntryMapper;

    public FaqServiceImpl(FaqEntryMapper faqEntryMapper) {
        this.faqEntryMapper = faqEntryMapper;
    }

    @Override
    public List<FaqEntryVO> listByCategory(String category) {
        LambdaQueryWrapper<FaqEntry> wrapper = new LambdaQueryWrapper<FaqEntry>()
            .eq(FaqEntry::getIsPublished, 1)
            .orderByDesc(FaqEntry::getSortOrder);
        if (category != null && !category.isEmpty()) {
            wrapper.eq(FaqEntry::getCategory, category);
        }
        return faqEntryMapper.selectList(wrapper).stream()
            .map(this::toVO)
            .collect(Collectors.toList());
    }

    @Override
    public List<FaqEntryVO> search(String keyword) {
        List<FaqEntry> entries = faqEntryMapper.selectList(
            new LambdaQueryWrapper<FaqEntry>()
                .eq(FaqEntry::getIsPublished, 1)
                .and(w -> w.like(FaqEntry::getQuestion, keyword)
                          .or()
                          .like(FaqEntry::getAnswer, keyword))
                .orderByDesc(FaqEntry::getSortOrder)
        );
        return entries.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<FaqEntryVO> getTopFAQs(int limit) {
        List<FaqEntry> entries = faqEntryMapper.selectList(
            new LambdaQueryWrapper<FaqEntry>()
                .eq(FaqEntry::getIsPublished, 1)
                .orderByDesc(FaqEntry::getClickCount)
                .last("LIMIT " + limit)
        );
        return entries.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void incrementClickCount(Integer id) {
        FaqEntry entry = faqEntryMapper.selectById(id);
        if (entry != null) {
            entry.setClickCount(entry.getClickCount() + 1);
            faqEntryMapper.updateById(entry);
        }
    }

    @Override
    public List<FaqEntryVO> listAll() {
        return faqEntryMapper.selectList(
            new LambdaQueryWrapper<FaqEntry>().orderByDesc(FaqEntry::getSortOrder)
        ).stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public FaqEntryVO getById(Integer id) {
        FaqEntry entry = faqEntryMapper.selectById(id);
        if (entry == null) throw new BusinessException(404, "FAQ 不存在");
        return toVO(entry);
    }

    @Override
    @Transactional
    public void create(FaqEntryVO vo) {
        FaqEntry entry = new FaqEntry();
        entry.setCategory(vo.getCategory());
        entry.setQuestion(vo.getQuestion());
        entry.setAnswer(vo.getAnswer());
        entry.setSortOrder(vo.getSortOrder() != null ? vo.getSortOrder() : 0);
        entry.setIsPublished(1);
        entry.setClickCount(0);
        faqEntryMapper.insert(entry);
        log.info("FAQ 已创建: id={}, category={}", entry.getId(), entry.getCategory());
    }

    @Override
    @Transactional
    public void update(FaqEntryVO vo) {
        FaqEntry entry = faqEntryMapper.selectById(vo.getId());
        if (entry == null) throw new BusinessException(404, "FAQ 不存在");
        if (vo.getCategory() != null) entry.setCategory(vo.getCategory());
        if (vo.getQuestion() != null) entry.setQuestion(vo.getQuestion());
        if (vo.getAnswer() != null) entry.setAnswer(vo.getAnswer());
        if (vo.getSortOrder() != null) entry.setSortOrder(vo.getSortOrder());
        faqEntryMapper.updateById(entry);
        log.info("FAQ 已更新: id={}", entry.getId());
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        faqEntryMapper.deleteById(id);
        log.info("FAQ 已删除: id={}", id);
    }

    private FaqEntryVO toVO(FaqEntry entry) {
        return FaqEntryVO.builder()
            .id(entry.getId())
            .category(entry.getCategory())
            .question(entry.getQuestion())
            .answer(entry.getAnswer())
            .sortOrder(entry.getSortOrder())
            .clickCount(entry.getClickCount())
            .build();
    }
}
