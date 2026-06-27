package com.es.user.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * 个人资料编辑请求体
 */
@Data
public class ProfileDTO {

    @Size(max = 50, message = "昵称不能超过50个字符")
    private String nickname;

    @Min(value = 6, message = "年龄至少为6岁")
    @Max(value = 99, message = "年龄不能超过99岁")
    private Integer age;

    @Pattern(regexp = "^(daily|exam|business)?$", message = "学习目标无效")
    private String goal;
}
