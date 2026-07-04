package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("group_join_requests")
public class GroupJoinRequest {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long groupId;
    private Long userId;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
    private Long reviewerId;
}
