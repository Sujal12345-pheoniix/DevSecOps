package com.devtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class PipelineStageResponse {
    private Long id;
    private Long runId;
    private String stageName;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String logs;
}
