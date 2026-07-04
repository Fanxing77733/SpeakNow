package com.es.learning.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.es.learning.dto.LearningPathVO;
import com.es.learning.dto.LearningPathVO.TaskVO;
import com.es.learning.entity.DailyCheckin;
import com.es.learning.entity.LearningPath;
import com.es.learning.entity.LearningPathTask;
import com.es.learning.mapper.DailyCheckinMapper;
import com.es.learning.mapper.LearningPathMapper;
import com.es.learning.mapper.LearningPathTaskMapper;
import com.es.learning.service.LearningPathService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class LearningPathServiceImpl implements LearningPathService {

    private static final Map<String, String> PATH_NAMES = Map.of(
            "exam_middle", "中考英语冲刺",
            "cet4_6", "四六级口语备考",
            "daily", "日常交流提升",
            "custom", "自定义路径"
    );

    private static final Map<String, String> PHASE_NAMES = Map.of(
            "1", "基础积累", "2", "能力提升", "3", "实战演练", "4", "冲刺阶段"
    );

    private final LearningPathMapper pathMapper;
    private final LearningPathTaskMapper taskMapper;
    private final DailyCheckinMapper checkinMapper;

    public LearningPathServiceImpl(LearningPathMapper pathMapper, LearningPathTaskMapper taskMapper,
                                    DailyCheckinMapper checkinMapper) {
        this.pathMapper = pathMapper;
        this.taskMapper = taskMapper;
        this.checkinMapper = checkinMapper;
    }

    @Override
    public LearningPathVO getPath(Long userId) {
        LearningPath path = findActivePath(userId);
        if (path == null) {
            LearningPathVO vo = new LearningPathVO();
            vo.setHasPath(false);
            vo.setMessage("请先选择学习路径");
            return vo;
        }
        return buildVO(path);
    }

    @Override
    @Transactional
    public LearningPathVO createPath(Long userId, String pathType) {
        // 关闭旧的 active 路径
        LambdaQueryWrapper<LearningPath> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LearningPath::getUserId, userId).eq(LearningPath::getStatus, "active");
        List<LearningPath> oldPaths = pathMapper.selectList(wrapper);
        for (LearningPath p : oldPaths) {
            p.setStatus("completed");
            pathMapper.updateById(p);
        }

        LearningPath path = new LearningPath();
        path.setUserId(userId);
        path.setPathType(pathType);
        path.setStatus("active");
        path.setCurrentPhase(1);
        path.setProgressPct(BigDecimal.ZERO);
        path.setCreatedAt(LocalDateTime.now());
        path.setUpdatedAt(LocalDateTime.now());
        pathMapper.insert(path);

        generateTasks(path.getId(), pathType);
        log.info("学习路径已创建: userId={}, pathType={}, pathId={}", userId, pathType, path.getId());
        return buildVO(path);
    }

    @Override
    @Transactional
    public LearningPathVO completeTask(Long userId, Long taskId) {
        LearningPathTask task = taskMapper.selectById(taskId);
        if (task == null || !"pending".equals(task.getStatus())) return null;

        task.setStatus("completed");
        task.setCompletedAt(LocalDateTime.now());
        taskMapper.updateById(task);

        // 自动打卡
        autoCheckin(userId);

        LearningPath path = pathMapper.selectById(task.getPathId());
        if (path == null) return null;

        // 重新计算进度
        Long totalTasks = taskMapper.selectCount(
                new LambdaQueryWrapper<LearningPathTask>().eq(LearningPathTask::getPathId, path.getId()));
        Long completedTasks = taskMapper.selectCount(
                new LambdaQueryWrapper<LearningPathTask>().eq(LearningPathTask::getPathId, path.getId())
                        .eq(LearningPathTask::getStatus, "completed"));
        int progress = totalTasks > 0 ? (int) (completedTasks * 100 / totalTasks) : 0;
        path.setProgressPct(BigDecimal.valueOf(progress));

        // 阶段推进 (≥60% 完成进入下一阶段)
        Long phaseTasks = taskMapper.selectCount(
                new LambdaQueryWrapper<LearningPathTask>().eq(LearningPathTask::getPathId, path.getId())
                        .eq(LearningPathTask::getPhase, path.getCurrentPhase()));
        Long phaseCompleted = taskMapper.selectCount(
                new LambdaQueryWrapper<LearningPathTask>().eq(LearningPathTask::getPathId, path.getId())
                        .eq(LearningPathTask::getPhase, path.getCurrentPhase())
                        .eq(LearningPathTask::getStatus, "completed"));
        if (phaseTasks > 0 && phaseCompleted * 100 / phaseTasks >= 60 && path.getCurrentPhase() < 4) {
            path.setCurrentPhase(path.getCurrentPhase() + 1);
            log.info("学习路径推进到阶段 {}: pathId={}", path.getCurrentPhase(), path.getId());
        }

        path.setUpdatedAt(LocalDateTime.now());
        pathMapper.updateById(path);
        return buildVO(path);
    }

    // ====== 私有方法 ======

    private LearningPath findActivePath(Long userId) {
        return pathMapper.selectOne(new LambdaQueryWrapper<LearningPath>()
            .eq(LearningPath::getUserId, userId).eq(LearningPath::getStatus, "active"));
    }

    private LearningPathVO buildVO(LearningPath path) {
        LearningPathVO vo = new LearningPathVO();
        vo.setHasPath(true);
        vo.setPathType(path.getPathType());
        vo.setPathName(PATH_NAMES.getOrDefault(path.getPathType(), path.getPathType()));
        vo.setStatus(path.getStatus());
        vo.setCurrentPhase(path.getCurrentPhase());
        vo.setTotalPhases(4);
        vo.setProgressPct(path.getProgressPct() != null ? path.getProgressPct().intValue() : 0);

        List<LearningPathTask> tasks = taskMapper.selectList(
                new LambdaQueryWrapper<LearningPathTask>().eq(LearningPathTask::getPathId, path.getId())
                        .orderByAsc(LearningPathTask::getPhase).orderByAsc(LearningPathTask::getScheduledDate));

        List<TaskVO> taskVOs = new ArrayList<>();
        for (LearningPathTask t : tasks) {
            TaskVO tv = new TaskVO();
            tv.setId(t.getId());
            tv.setPhase(t.getPhase());
            tv.setPhaseName(PHASE_NAMES.getOrDefault(String.valueOf(t.getPhase()), "阶段" + t.getPhase()));
            tv.setTaskType(t.getTaskType());
            tv.setTaskName(t.getTaskName() != null ? t.getTaskName() : "学习任务");
            tv.setStatus(t.getStatus());
            tv.setScheduledDate(t.getScheduledDate() != null ? t.getScheduledDate().format(DateTimeFormatter.ISO_DATE) : null);
            taskVOs.add(tv);
        }
        vo.setTasks(taskVOs);
        return vo;
    }

    private void generateTasks(Long pathId, String pathType) {
        LocalDate today = LocalDate.now();
        String[][] taskDefs = switch (pathType) {
            case "exam_middle" -> new String[][]{
                {"1", "practice", "发音练习：中考必考句型", "0"}, {"1", "vocab", "词汇积累：中考核心词汇", "1"},
                {"1", "conversation", "情景对话：自我介绍", "2"}, {"2", "practice", "发音练习：话题演讲", "3"},
                {"2", "grammar", "语法练习：时态与语态", "4"}, {"2", "conversation", "情景对话：看图说话", "5"},
                {"3", "conversation", "实战对话：模拟考试", "6"}, {"3", "grammar", "语法练习：从句与连接词", "7"},
                {"4", "practice", "冲刺练习：真题跟读", "8"}, {"4", "conversation", "模拟考试完整流程", "9"},
            };
            case "cet4_6" -> new String[][]{
                {"1", "vocab", "词汇积累：四级高频词", "0"}, {"1", "practice", "发音练习：短文朗读", "1"},
                {"1", "conversation", "情景对话：自我介绍", "2"}, {"2", "grammar", "语法练习：四六级语法", "3"},
                {"2", "practice", "发音练习：长句朗读", "4"}, {"2", "conversation", "情景对话：话题讨论", "5"},
                {"3", "conversation", "实战对话：模拟口试", "6"}, {"3", "grammar", "语法练习：高级句型", "7"},
                {"4", "practice", "冲刺练习：真题跟读", "8"}, {"4", "conversation", "模拟口试完整流程", "9"},
            };
            default -> new String[][]{
                {"1", "vocab", "词汇积累：日常常用词", "0"}, {"1", "practice", "发音练习：日常短句", "1"},
                {"1", "conversation", "情景对话：餐厅点餐", "2"}, {"2", "practice", "发音练习：旅行用语", "3"},
                {"2", "conversation", "情景对话：酒店入住", "4"}, {"2", "grammar", "语法练习：常用时态", "5"},
                {"3", "conversation", "实战对话：购物场景", "6"}, {"3", "practice", "发音练习：商务用语", "7"},
                {"4", "conversation", "实战对话：综合场景", "8"}, {"4", "grammar", "语法练习：巩固提高", "9"},
            };
        };

        for (String[] def : taskDefs) {
            LearningPathTask task = new LearningPathTask();
            task.setPathId(pathId);
            task.setPhase(Integer.parseInt(def[0]));
            task.setTaskType(def[1]);
            task.setTaskName(def[2]);
            task.setScheduledDate(today.plusDays(Long.parseLong(def[3])));
            task.setStatus("pending");
            taskMapper.insert(task);
        }
    }

    /** 自动打卡：同一天幂等更新 */
    private void autoCheckin(Long userId) {
        try {
            LocalDate today = LocalDate.now();
            DailyCheckin existing = checkinMapper.selectOne(new LambdaQueryWrapper<DailyCheckin>()
                .eq(DailyCheckin::getUserId, userId).eq(DailyCheckin::getCheckinDate, today));
            if (existing != null) {
                existing.setTaskCount((existing.getTaskCount() != null ? existing.getTaskCount() : 0) + 1);
                checkinMapper.updateById(existing);
            } else {
                DailyCheckin ck = new DailyCheckin();
                ck.setUserId(userId);
                ck.setCheckinDate(today);
                ck.setTaskCount(1);
                ck.setCreatedAt(LocalDateTime.now());
                checkinMapper.insert(ck);
            }
            log.debug("打卡成功: userId={}, date={}", userId, today);
        } catch (Exception e) {
            log.warn("打卡失败: userId={}", userId, e);
        }
    }
}
