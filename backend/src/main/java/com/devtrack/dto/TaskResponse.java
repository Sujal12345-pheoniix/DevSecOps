package com.devtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String assigneeUsername;
    private Long assigneeId;
    private Long projectId;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
}
