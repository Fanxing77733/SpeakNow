package com.es.practice.controller;

import com.es.common.dto.Result;
import com.es.practice.dto.CorrectionVO;
import com.es.practice.dto.GrammarCheckDTO;
import com.es.practice.dto.GrammarCheckResultVO;
import com.es.practice.service.GrammarService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 语法纠错控制器（V2.0）
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/grammar")
public class GrammarController {

    private final GrammarService grammarService;

    public GrammarController(GrammarService grammarService) {
        this.grammarService = grammarService;
    }

    /** 语法纠错 */
    @PostMapping("/check")
    public Result<GrammarCheckResultVO> checkGrammar(@Valid @RequestBody GrammarCheckDTO dto) {
        Long userId = getCurrentUserId();
        log.info("语法纠错: userId={}, inputType={}, textLen={}", userId, dto.getInputType(), dto.getText().length());
        GrammarCheckResultVO result = grammarService.check(userId, dto.getText(), dto.getInputType());
        return Result.ok(result);
    }

    /** 收藏到错题本 */
    @PostMapping("/bookmark")
    public Result<Void> saveToBook(@RequestBody CorrectionVO item) {
        Long userId = getCurrentUserId();
        log.info("收藏错题: userId={}, errorType={}", userId, item.getErrorType());
        grammarService.saveToBook(userId, item);
        return Result.ok();
    }

    /** 查看错题本 */
    @GetMapping("/bookmarks")
    public Result<List<CorrectionVO>> getErrorBook(@RequestParam(required = false) String errorType) {
        Long userId = getCurrentUserId();
        List<CorrectionVO> list = grammarService.getErrorBook(userId, errorType);
        return Result.ok(list);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long)) {
            throw new RuntimeException("未登录或认证已过期");
        }
        return (Long) auth.getPrincipal();
    }
}
