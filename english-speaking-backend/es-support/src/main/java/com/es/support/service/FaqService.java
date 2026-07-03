package com.es.support.service;

import com.es.support.dto.FaqEntryVO;

import java.util.List;

public interface FaqService {
    List<FaqEntryVO> listByCategory(String category);
    List<FaqEntryVO> search(String keyword);
    List<FaqEntryVO> getTopFAQs(int limit);
    void incrementClickCount(Integer id);
    List<FaqEntryVO> listAll();
    FaqEntryVO getById(Integer id);
    void create(FaqEntryVO vo);
    void update(FaqEntryVO vo);
    void delete(Integer id);
}
