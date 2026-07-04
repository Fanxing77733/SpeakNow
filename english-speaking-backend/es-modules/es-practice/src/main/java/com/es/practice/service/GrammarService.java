package com.es.practice.service;

import com.es.practice.dto.CorrectionVO;
import com.es.practice.dto.GrammarCheckResultVO;

import java.util.List;

/**
 * 语法纠错服务接口（V2.0）
 */
public interface GrammarService {

    /** 语法纠错 */
    GrammarCheckResultVO check(Long userId, String text, String inputType);

    /** 收藏到错题本 */
    void saveToBook(Long userId, CorrectionVO item);

    /** 查看错题本（按错误类型筛选） */
    List<CorrectionVO> getErrorBook(Long userId, String errorType);
}
