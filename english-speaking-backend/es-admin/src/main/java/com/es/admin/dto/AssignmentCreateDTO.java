package com.es.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AssignmentCreateDTO {

    @NotNull(message = "班级不能为空")
    private Long classId;

    @NotBlank(message = "作业标题不能为空")
    private String title;

    private String description;
    private String assignmentType;
    private Long contentId;
    private String contentIds;
    private String sceneKey;
    private String difficulty;
    private Integer requiredRounds;
    private LocalDateTime deadline;
    private String publishType;
    private LocalDateTime publishAt;
}
