package com.es.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("prediction_results")
public class PredictionResult {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private BigDecimal predictedScore;
    private LocalDate predictionDate;
    private String alertType;
    private String alertMessage;
    private LocalDateTime generatedAt;
}
