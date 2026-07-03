package com.es.admin.controller.operator;

import com.es.common.dto.Result;
import com.es.support.dto.FaqEntryVO;
import com.es.support.service.FaqService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/operator/faq")
public class FaqManageController {

    private final FaqService faqService;

    public FaqManageController(FaqService faqService) {
        this.faqService = faqService;
    }

    /** 获取全部 FAQ（含未发布） */
    @GetMapping
    public Result<List<FaqEntryVO>> listAll() {
        return Result.ok(faqService.listAll());
    }

    /** 获取单个 FAQ */
    @GetMapping("/{id}")
    public Result<FaqEntryVO> getById(@PathVariable Integer id) {
        return Result.ok(faqService.getById(id));
    }

    /** 新增 FAQ */
    @PostMapping
    public Result<Void> create(@Valid @RequestBody FaqEntryVO vo) {
        faqService.create(vo);
        return Result.ok(null);
    }

    /** 编辑 FAQ */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Integer id, @Valid @RequestBody FaqEntryVO vo) {
        vo.setId(id);
        faqService.update(vo);
        return Result.ok(null);
    }

    /** 删除 FAQ */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Integer id) {
        faqService.delete(id);
        return Result.ok(null);
    }
}
