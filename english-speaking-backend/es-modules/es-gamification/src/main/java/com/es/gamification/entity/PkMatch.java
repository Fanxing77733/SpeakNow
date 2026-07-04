package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("pk_matches")
public class PkMatch {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long player1Id;
    private Long player2Id;
    private Long wordListId;
    private String status;
    private BigDecimal player1Score;
    private BigDecimal player2Score;
    private LocalDateTime player1SubmittedAt;
    private LocalDateTime player2SubmittedAt;
    private String result;
    private LocalDateTime judgedAt;
    private LocalDateTime createdAt;
}
