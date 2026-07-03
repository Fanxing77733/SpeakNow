package com.es.admin.dto;

import lombok.Data;

@Data
public class UserSearchDTO {

    private String keyword;   // 邮箱/手机/昵称搜索
    private String status;    // active/banned
    private Integer page = 1;
    private Integer size = 20;
}
