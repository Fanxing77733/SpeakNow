package com.es.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClassCreateDTO {

    @NotBlank(message = "班级名称不能为空")
    @Size(min = 2, max = 100, message = "班级名称需2-100个字符")
    private String name;

    @Size(max = 500, message = "描述不能超过500个字符")
    private String description;
}
