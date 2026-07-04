package com.es.gamification.scheduler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.gamification.entity.GroupTopic;
import com.es.gamification.entity.StudyGroup;
import com.es.gamification.mapper.GroupTopicMapper;
import com.es.gamification.mapper.StudyGroupMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

/**
 * 每日话题推送定时任务（5.4 学习小组增强）
 * 每天早上 9:00 为开启话题推送的小组推送一条每日话题
 */
@Slf4j
@Component
public class DailyTopicPushTask {

    private final StudyGroupMapper groupMapper;
    private final GroupTopicMapper topicMapper;
    private final Random random = new Random();

    /** 预置话题库 */
    private static final String[] TOPIC_POOL = {
        "今天的英语学习目标是什么？",
        "分享一个你最近学到的新单词",
        "用英语描述你今天的心情",
        "你最喜欢的英文歌曲是什么？为什么？",
        "如果可以去任何国家旅行，你会去哪里？",
        "用英语介绍你最喜欢的一道菜",
        "你觉得学习英语最困难的地方是什么？",
        "推荐一部你最近看的英文电影",
        "说一句你最喜欢的英文名言",
        "用英语描述你理想中的一天",
        "你用过的最有效的英语学习方法是什么？",
        "分享一个有趣的英语俚语或习语",
        "如果可以拥有一种超能力，会是什么？",
        "用英语讲述一个令你印象深刻的小故事",
        "你觉得英语口语中最大的挑战是什么？",
    };

    public DailyTopicPushTask(StudyGroupMapper groupMapper, GroupTopicMapper topicMapper) {
        this.groupMapper = groupMapper;
        this.topicMapper = topicMapper;
    }

    @Scheduled(cron = "0 0 9 * * ?")
    public void pushDailyTopics() {
        try {
            List<StudyGroup> groups = groupMapper.selectList(
                new LambdaQueryWrapper<StudyGroup>()
                    .eq(StudyGroup::getTopicPushEnabled, true));

            if (groups.isEmpty()) {
                log.debug("没有需要推送话题的小组");
                return;
            }

            int pushedCount = 0;
            for (StudyGroup group : groups) {
                String topic = TOPIC_POOL[random.nextInt(TOPIC_POOL.length)];

                GroupTopic gt = new GroupTopic();
                gt.setGroupId(group.getId());
                gt.setTopicContent(topic);
                gt.setPushedAt(LocalDateTime.now());
                topicMapper.insert(gt);

                // 更新 lastTopicAt
                group.setLastTopicAt(LocalDateTime.now());
                groupMapper.updateById(group);

                pushedCount++;
            }

            log.info("每日话题推送完成: 共推送 {} 个小组", pushedCount);
        } catch (Exception e) {
            log.error("每日话题推送失败", e);
        }
    }
}
