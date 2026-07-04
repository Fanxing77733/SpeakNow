package com.es.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BindContactDTO {

    @NotBlank(message = "验证码不能为空")
    private String code;

    @NotBlank(message = "手机号或邮箱不能为空")
    private String contact;
}
