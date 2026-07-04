package com.es.learning.dto;

import lombok.Data;
import java.util.List;

@Data
public class LearningPathVO {
    private boolean hasPath;
    private String message;
    private String pathType;
    private String pathName;
    private String status;
    private int currentPhase;
    private int totalPhases;
    private int progressPct;
    private List<TaskVO> tasks;

    @Data
    public static class TaskVO {
        private Long id;
        private int phase;
        private String phaseName;
        private String taskType;
        private String taskName;
        private String status;
        private String scheduledDate;
    }
}
