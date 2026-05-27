package com.devtrack.controller;

import com.devtrack.dto.PipelineResponse;
import com.devtrack.dto.PipelineRunResponse;
import com.devtrack.dto.PipelineStageResponse;
import com.devtrack.security.UserPrincipal;
import com.devtrack.service.PipelineSimulatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pipelines")
public class PipelineController {

    @Autowired
    private PipelineSimulatorService pipelineSimulatorService;

    @GetMapping
    public ResponseEntity<List<PipelineResponse>> getAllPipelines() {
        List<PipelineResponse> pipelines = pipelineSimulatorService.getAllPipelines();
        return ResponseEntity.ok(pipelines);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PipelineResponse> getPipelineById(@PathVariable Long id) {
        PipelineResponse pipeline = pipelineSimulatorService.getPipelineById(id);
        return ResponseEntity.ok(pipeline);
    }

    @PostMapping("/{id}/trigger")
    public ResponseEntity<PipelineRunResponse> triggerPipeline(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        PipelineRunResponse run = pipelineSimulatorService.triggerPipeline(id, principal.getId());
        return ResponseEntity.ok(run);
    }

    @GetMapping("/{id}/runs")
    public ResponseEntity<List<PipelineRunResponse>> getRunHistory(@PathVariable Long id) {
        List<PipelineRunResponse> history = pipelineSimulatorService.getRunHistoryByPipeline(id);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/runs/{runId}")
    public ResponseEntity<PipelineRunResponse> getRunDetails(@PathVariable Long runId) {
        PipelineRunResponse details = pipelineSimulatorService.getRunDetails(runId);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/runs/{runId}/stages")
    public ResponseEntity<List<PipelineStageResponse>> getRunStages(@PathVariable Long runId) {
        List<PipelineStageResponse> stages = pipelineSimulatorService.getStagesByRun(runId);
        return ResponseEntity.ok(stages);
    }

    @GetMapping("/recent-deployments")
    public ResponseEntity<List<PipelineRunResponse>> getRecentDeployments() {
        List<PipelineRunResponse> recent = pipelineSimulatorService.getRecentDeployments();
        return ResponseEntity.ok(recent);
    }
}
