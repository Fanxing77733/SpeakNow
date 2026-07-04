package com.es.gamification.dto;

import lombok.Data;
import java.util.List;

@Data
public class GroupDetailVO {
    private Long id;
    private String name;
    private String description;
    private int memberCount;
    private String visibility;
    private Long ownerId;
    private String ownerName;
    private String myRole;
    private boolean member;
    private boolean topicPushEnabled;
    private List<ChallengeVO> challenges;
    private List<DiscussionVO> discussions;
}
