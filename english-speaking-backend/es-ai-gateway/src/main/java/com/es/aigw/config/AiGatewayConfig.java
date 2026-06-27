package com.es.aigw.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI Gateway 全局配置
 * 对应 application.yml 中 aigw.* 配置项
 */
@Data
@Component
@ConfigurationProperties(prefix = "aigw")
public class AiGatewayConfig {

    /** 连接超时（毫秒），默认 5000 */
    private int connectTimeout = 5000;

    /** 读取超时（毫秒），默认 30000 */
    private int readTimeout = 30000;

    /** 最大重试次数，默认 3 */
    private int maxRetries = 3;

    /** 每分钟调用次数限制，默认 60 */
    private int rateLimitPerMinute = 60;
}
