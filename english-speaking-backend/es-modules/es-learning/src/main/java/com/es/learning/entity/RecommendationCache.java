package com.es.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("recommendation_cache")
public class RecommendationCache {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String contentType;
    private Integer contentId;
    private BigDecimal score;
    private String reason;
    private LocalDateTime generatedAt;
}
