package com.devtrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TaskRequest {
    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String status; // TODO, IN_PROGRESS, IN_REVIEW, COMPLETED

    @NotBlank
    private String priority; // LOW, MEDIUM, HIGH

    private Long assigneeId; // Nullable

    @NotNull
    private Long projectId;

    private LocalDate dueDate;
}
