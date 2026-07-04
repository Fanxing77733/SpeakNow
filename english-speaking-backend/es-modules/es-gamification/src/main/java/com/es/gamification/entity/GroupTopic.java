package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("group_topics")
public class GroupTopic {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long groupId;
    private String topicContent;
    private LocalDateTime pushedAt;
}
