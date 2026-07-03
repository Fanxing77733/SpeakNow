package com.es.support.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FaqEntryVO {
    private Integer id;
    private String category;
    private String question;
    private String answer;
    private Integer sortOrder;
    private Integer clickCount;
}
