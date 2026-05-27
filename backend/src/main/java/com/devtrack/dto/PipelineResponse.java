package com.devtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class PipelineResponse {
    private Long id;
    private String name;
    private Long projectId;
    private String projectName;
    private String status;
    private String currentStage;
}
