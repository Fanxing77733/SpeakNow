package com.es.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BanUserDTO {

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    private String reason;
}
