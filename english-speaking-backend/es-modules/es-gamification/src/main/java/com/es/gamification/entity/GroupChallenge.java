package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("group_challenges")
public class GroupChallenge {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long groupId;
    private Long createdBy;
    private String title;
    private String description;
    private Integer contentId;
    private Integer durationHours;
    private Integer maxSubmissions;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private String status;
    private LocalDateTime createdAt;
}
