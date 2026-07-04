package com.es.user.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionVO {

    private String id;
    private String ip;
    private String userAgent;
    private String loginTime;
    private boolean current;
}
