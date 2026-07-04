package com.es.gamification.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("shop_items")
public class ShopItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    private String icon;
    private Integer price;
    private String itemType;
    private String effectJson;
    private Integer stock;
    private Integer isActive;
    private LocalDateTime createdAt;
}
