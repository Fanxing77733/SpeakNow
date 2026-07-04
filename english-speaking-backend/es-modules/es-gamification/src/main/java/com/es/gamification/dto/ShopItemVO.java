package com.es.gamification.dto;

import lombok.Data;

@Data
public class ShopItemVO {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private int price;
    private String itemType;
    private int stock;
    private boolean purchased;
}
