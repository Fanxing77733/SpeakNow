package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("study_groups")
public class StudyGroup {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    private Long ownerId;
    private String visibility;
    private Integer memberCount;
    private Boolean topicPushEnabled;
    private LocalDateTime lastTopicAt;
    private LocalDateTime createdAt;
}
