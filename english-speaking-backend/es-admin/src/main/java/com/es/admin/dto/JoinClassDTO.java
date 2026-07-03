package com.es.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinClassDTO {

    @NotBlank(message = "邀请码不能为空")
    private String inviteCode;
}
