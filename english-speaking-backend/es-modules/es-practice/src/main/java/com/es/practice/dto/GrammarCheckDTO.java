package com.es.practice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 语法纠错请求体（V2.0）
 */
@Data
public class GrammarCheckDTO {

    @NotBlank
    @Size(max = 500)
    private String text;

    /** 输入方式：text / voice */
    private String inputType = "text";
}
