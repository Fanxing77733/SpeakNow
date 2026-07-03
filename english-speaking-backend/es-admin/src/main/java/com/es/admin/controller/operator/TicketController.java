package com.es.admin.controller.operator;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.es.common.dto.Result;
import com.es.common.exception.BusinessException;
import com.es.support.entity.SupportTicket;
import com.es.support.mapper.SupportTicketMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/operator/support")
public class TicketController {

    private final SupportTicketMapper ticketMapper;

    public TicketController(SupportTicketMapper ticketMapper) {
        this.ticketMapper = ticketMapper;
    }

    /** 工单列表（分页） */
    @GetMapping("/tickets")
    public Result<Page<SupportTicket>> listTickets(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<SupportTicket> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(SupportTicket::getStatus, status);
        }
        wrapper.orderByDesc(SupportTicket::getCreatedAt);
        Page<SupportTicket> result = ticketMapper.selectPage(new Page<>(page, size), wrapper);
        return Result.ok(result);
    }

    /** 解决工单 */
    @PostMapping("/tickets/{id}/resolve")
    public Result<Void> resolveTicket(@PathVariable Long id,
                                       @RequestParam String resolution,
                                       HttpServletRequest request) {
        Long operatorId = getCurrentUserId();
        SupportTicket ticket = ticketMapper.selectById(id);
        if (ticket == null) throw new BusinessException(404, "工单不存在");
        ticket.setStatus("RESOLVED");
        ticket.setAssigneeId(operatorId);
        ticket.setResolution(resolution);
        ticket.setResolvedAt(LocalDateTime.now());
        ticketMapper.updateById(ticket);
        log.info("工单已解决: ticketId={}, operatorId={}", id, operatorId);
        return Result.ok(null);
    }

    /** 开始处理工单 */
    @PostMapping("/tickets/{id}/claim")
    public Result<Void> claimTicket(@PathVariable Long id) {
        Long operatorId = getCurrentUserId();
        SupportTicket ticket = ticketMapper.selectById(id);
        if (ticket == null) throw new BusinessException(404, "工单不存在");
        ticket.setStatus("IN_PROGRESS");
        ticket.setAssigneeId(operatorId);
        ticketMapper.updateById(ticket);
        log.info("工单已认领: ticketId={}, operatorId={}", id, operatorId);
        return Result.ok(null);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}
