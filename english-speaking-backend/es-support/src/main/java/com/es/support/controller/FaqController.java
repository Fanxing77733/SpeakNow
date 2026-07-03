package com.es.support.controller;

import com.es.common.dto.Result;
import com.es.support.dto.FaqEntryVO;
import com.es.support.service.FaqService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/support/faq")
public class FaqController {

    private final FaqService faqService;

    public FaqController(FaqService faqService) {
        this.faqService = faqService;
    }

    /** 按分类列出 FAQ（公开接口） */
    @GetMapping
    public Result<List<FaqEntryVO>> listByCategory(@RequestParam(required = false) String category) {
        List<FaqEntryVO> list = faqService.listByCategory(category);
        return Result.ok(list);
    }

    /** 关键词搜索 FAQ（公开接口） */
    @GetMapping("/search")
    public Result<List<FaqEntryVO>> search(@RequestParam String keyword) {
        List<FaqEntryVO> list = faqService.search(keyword);
        return Result.ok(list);
    }

    /** 热门 FAQ Top N */
    @GetMapping("/hot")
    public Result<List<FaqEntryVO>> getHotFAQs(@RequestParam(defaultValue = "5") int limit) {
        List<FaqEntryVO> list = faqService.getTopFAQs(limit);
        return Result.ok(list);
    }

    /** FAQ 点击计数 */
    @PostMapping("/{id}/click")
    public Result<Void> incrementClick(@PathVariable Integer id) {
        faqService.incrementClickCount(id);
        return Result.ok(null);
    }
}
