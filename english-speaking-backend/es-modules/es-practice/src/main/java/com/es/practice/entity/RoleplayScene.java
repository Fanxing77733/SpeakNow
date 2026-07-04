package com.es.practice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("roleplay_scenes")
public class RoleplayScene {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String sceneKey;
    private String nameZh;
    private String nameEn;
    private String descriptionZh;
    private String difficulty;
    private String userRoleZh;
    private String aiRoleZh;
    private String aiPersonality;
    private String objectiveZh;
    private Integer totalRounds;
    private BigDecimal passScore;
    private String iconEmoji;
    private String category;
    private Integer sortOrder;
    private Integer isEnabled;
    private String systemPrompt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
