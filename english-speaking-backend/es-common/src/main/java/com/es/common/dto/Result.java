package com.es.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * 统一 API 响应体
 * <pre>
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": {},
 *   "timestamp": "2026-06-23T10:00:00Z"
 * }
 * </pre>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> {

    private int code;
    private String message;
    private T data;
    private String timestamp;

    /** 成功响应（带数据） */
    public static <T> Result<T> ok(T data) {
        return new Result<>(200, "success", data, nowUtc());
    }

    /** 成功响应（无数据） */
    public static <T> Result<T> ok() {
        return ok(null);
    }

    /** 失败响应 */
    public static <T> Result<T> fail(int code, String message) {
        return new Result<>(code, message, null, nowUtc());
    }

    private static String nowUtc() {
        return Instant.now()
                .atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));
    }
}
