package com.es.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewDecisionDTO {

    @NotNull(message = "审核结果不能为空")
    private String action;  // APPROVE / REJECT / SKIP

    private String comment;
}
