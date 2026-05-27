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
public class PipelineRunResponse {
    private Long id;
    private Long pipelineId;
    private String pipelineName;
    private Long runNumber;
    private String status;
    private String triggeredByUsername;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String logOutput;
}
