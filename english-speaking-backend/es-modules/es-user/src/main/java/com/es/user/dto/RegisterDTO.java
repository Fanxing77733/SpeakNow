package com.es.user.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * 用户注册请求体
 */
@Data
public class RegisterDTO {

    @Email(message = "请输入有效的邮箱地址")
    private String email;

    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "请输入有效的手机号")
    private String phone;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 20, message = "密码长度需在8至20位之间")
    @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$", message = "密码需包含字母和数字")
    private String password;

    @NotNull(message = "年龄不能为空")
    @Min(value = 6, message = "年龄至少为6岁")
    @Max(value = 99, message = "年龄不能超过99岁")
    private Integer age;

    @NotBlank(message = "学习目标不能为空")
    @Pattern(regexp = "^(daily|exam|business)$", message = "学习目标无效")
    private String goal;
}
