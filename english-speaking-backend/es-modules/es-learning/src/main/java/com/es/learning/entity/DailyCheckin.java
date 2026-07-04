package com.es.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("daily_checkins")
public class DailyCheckin {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private LocalDate checkinDate;
    private Integer taskCount;
    private LocalDateTime createdAt;
}
