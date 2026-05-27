package com.devtrack.service;

import com.devtrack.dto.PipelineResponse;
import com.devtrack.dto.PipelineRunResponse;
import com.devtrack.dto.PipelineStageResponse;
import com.devtrack.exception.BadRequestException;
import com.devtrack.exception.ResourceNotFoundException;
import com.devtrack.model.*;
import com.devtrack.repository.PipelineRepository;
import com.devtrack.repository.PipelineRunRepository;
import com.devtrack.repository.PipelineStageRepository;
import com.devtrack.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PipelineSimulatorService {

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private PipelineStageRepository pipelineStageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    private final ExecutorService executorService = Executors.newCachedThreadPool();

    public List<PipelineResponse> getAllPipelines() {
        return pipelineRepository.findAll().stream()
                .map(this::mapToPipelineResponse)
                .collect(Collectors.toList());
    }

    public PipelineResponse getPipelineById(Long id) {
        Pipeline pipeline = pipelineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline not found with id: " + id));
        return mapToPipelineResponse(pipeline);
    }

    public List<PipelineRunResponse> getRunHistoryByPipeline(Long pipelineId) {
        return pipelineRunRepository.findByPipelineId(pipelineId).stream()
                .map(this::mapToRunResponse)
                .collect(Collectors.toList());
    }

    public PipelineRunResponse getRunDetails(Long runId) {
        PipelineRun run = pipelineRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline run not found with id: " + runId));
        return mapToRunResponse(run);
    }

    public List<PipelineStageResponse> getStagesByRun(Long runId) {
        return pipelineStageRepository.findByPipelineRunId(runId).stream()
                .map(this::mapToStageResponse)
                .collect(Collectors.toList());
    }

    public List<PipelineRunResponse> getRecentDeployments() {
        return pipelineRunRepository.findTop5ByOrderByStartedAtDesc().stream()
                .map(this::mapToRunResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PipelineRunResponse triggerPipeline(Long pipelineId, Long userId) {
        Pipeline pipeline = pipelineRepository.findById(pipelineId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline not found with id: " + pipelineId));

        if (pipeline.getStatus() == PipelineStatus.RUNNING) {
            throw new BadRequestException("Pipeline is already running!");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Long nextRunNumber = pipelineRunRepository.findMaxRunNumberByPipelineId(pipelineId) + 1;

        // Initialize Run
        PipelineRun run = PipelineRun.builder()
                .pipeline(pipeline)
                .runNumber(nextRunNumber)
                .status(PipelineStatus.RUNNING)
                .triggeredBy(user)
                .startedAt(LocalDateTime.now())
                .logOutput("Triggering pipeline execution...\n")
                .build();
        PipelineRun savedRun = pipelineRunRepository.save(run);

        // Update Pipeline status
        pipeline.setStatus(PipelineStatus.RUNNING);
        pipeline.setCurrentStage(StageName.BUILD);
        pipelineRepository.save(pipeline);

        // Initialize Stages
        PipelineStage buildStage = PipelineStage.builder()
                .pipelineRun(savedRun)
                .stageName(StageName.BUILD)
                .status(StageStatus.RUNNING)
                .startedAt(LocalDateTime.now())
                .logs("BUILD stage started.\n")
                .build();

        PipelineStage testStage = PipelineStage.builder()
                .pipelineRun(savedRun)
                .stageName(StageName.TEST)
                .status(StageStatus.PENDING)
                .logs("Waiting for BUILD stage...\n")
                .build();

        PipelineStage deployStage = PipelineStage.builder()
                .pipelineRun(savedRun)
                .stageName(StageName.DEPLOY)
                .status(StageStatus.PENDING)
                .logs("Waiting for TEST stage...\n")
                .build();

        pipelineStageRepository.save(buildStage);
        pipelineStageRepository.save(testStage);
        pipelineStageRepository.save(deployStage);

        notificationService.createNotification(
                user,
                "Pipeline run #" + nextRunNumber + " started for project " + pipeline.getProject().getName(),
                NotificationType.INFO
        );

        // Run simulation asynchronously
        executorService.submit(() -> simulatePipeline(savedRun.getId(), pipelineId, userId));

        return mapToRunResponse(savedRun);
    }

    private void simulatePipeline(Long runId, Long pipelineId, Long userId) {
        try {
            // Wait a moment before starting build
            Thread.sleep(2000);

            // 1. BUILD STAGE
            updateStageLogs(runId, StageName.BUILD, 
                "--- BUILD STAGE STARTED ---\n" +
                "[INFO] Checking out codebase from branch 'main'...\n" +
                "[INFO] Found pom.xml. Initializing Maven Build...\n" +
                "[INFO] Running command: mvn clean package -DskipTests\n" +
                "[INFO] Compiling 24 Java source files...\n" +
                "[INFO] Packaging jar: /app/target/devtrack-0.0.1-SNAPSHOT.jar\n" +
                "[INFO] Build Success! Generated artifact in 2.85s.\n" +
                "--- BUILD STAGE SUCCESS ---\n"
            );
            completeStage(runId, StageName.BUILD, StageStatus.SUCCESS);
            updatePipelineStage(pipelineId, StageName.TEST);
            startStage(runId, StageName.TEST, "--- TEST STAGE STARTED ---\n[INFO] Running unit tests suite...\n");

            Thread.sleep(3000);

            // 2. TEST STAGE (15% failure rate for realism)
            boolean willSucceed = Math.random() > 0.15;
            if (willSucceed) {
                updateStageLogs(runId, StageName.TEST, 
                    "[INFO] Executing 42 unit and integration tests...\n" +
                    "[INFO] Test case 1: authenticateUser_Success - PASSED\n" +
                    "[INFO] Test case 2: createProject_Success - PASSED\n" +
                    "[INFO] Test case 3: runPipeline_Success - PASSED\n" +
                    "[INFO] Tests run: 42, Failures: 0, Errors: 0, Skipped: 0\n" +
                    "[INFO] SonarQube quality gate: PASSED (Coverage: 88.4%)\n" +
                    "--- TEST STAGE SUCCESS ---\n"
                );
                completeStage(runId, StageName.TEST, StageStatus.SUCCESS);
                updatePipelineStage(pipelineId, StageName.DEPLOY);
                startStage(runId, StageName.DEPLOY, "--- DEPLOY STAGE STARTED ---\n[INFO] Initializing CD deployment...\n");

                Thread.sleep(3000);

                // 3. DEPLOY STAGE
                updateStageLogs(runId, StageName.DEPLOY, 
                    "[INFO] Authenticating with Docker Container Registry...\n" +
                    "[INFO] Building Docker Image devtrack-app:latest...\n" +
                    "[INFO] Image pushed to registry (128 MB)\n" +
                    "[INFO] Deploying to Kubernetes namespace 'production'...\n" +
                    "[INFO] Rolling update: deployment 'devtrack-api'...\n" +
                    "[INFO] Waiting for target pods to stabilize...\n" +
                    "[INFO] Health checks passed for all target pods.\n" +
                    "[INFO] Platform deployed successfully to https://devtrack.prod.local\n" +
                    "--- DEPLOY STAGE SUCCESS ---\n"
                );
                completeStage(runId, StageName.DEPLOY, StageStatus.SUCCESS);
                completePipelineRun(runId, pipelineId, userId, PipelineStatus.SUCCESS);

            } else {
                updateStageLogs(runId, StageName.TEST, 
                    "[INFO] Executing 42 unit and integration tests...\n" +
                    "[INFO] Test case 1: authenticateUser_Success - PASSED\n" +
                    "[ERROR] Test case 2: createProject_FailureDueToDuplicateName - FAILED\n" +
                    "[ERROR] org.opentest4j.AssertionFailedError: expected: <400> but was: <500>\n" +
                    "[ERROR] Tests run: 42, Failures: 1, Errors: 0, Skipped: 0\n" +
                    "[ERROR] SonarQube quality gate: FAILED (Quality Gate failed on critical bug counts)\n" +
                    "--- TEST STAGE FAILED ---\n"
                );
                completeStage(runId, StageName.TEST, StageStatus.FAILED);
                cancelStage(runId, StageName.DEPLOY, "[WARNING] Deployment cancelled because the TEST stage failed.\n");
                completePipelineRun(runId, pipelineId, userId, PipelineStatus.FAILED);
            }

        } catch (InterruptedException e) {
            log.error("Pipeline execution interrupted", e);
            completePipelineRun(runId, pipelineId, userId, PipelineStatus.FAILED);
        }
    }

    private void startStage(Long runId, StageName stageName, String initialLogs) {
        List<PipelineStage> stages = pipelineStageRepository.findByPipelineRunId(runId);
        stages.stream()
                .filter(s -> s.getStageName() == stageName)
                .findFirst()
                .ifPresent(s -> {
                    s.setStatus(StageStatus.RUNNING);
                    s.setStartedAt(LocalDateTime.now());
                    s.setLogs(initialLogs);
                    pipelineStageRepository.save(s);
                });
    }

    private void updateStageLogs(Long runId, StageName stageName, String logAppend) {
        List<PipelineStage> stages = pipelineStageRepository.findByPipelineRunId(runId);
        stages.stream()
                .filter(s -> s.getStageName() == stageName)
                .findFirst()
                .ifPresent(s -> {
                    s.setLogs(s.getLogs() + logAppend);
                    pipelineStageRepository.save(s);
                });
    }

    private void completeStage(Long runId, StageName stageName, StageStatus status) {
        List<PipelineStage> stages = pipelineStageRepository.findByPipelineRunId(runId);
        stages.stream()
                .filter(s -> s.getStageName() == stageName)
                .findFirst()
                .ifPresent(s -> {
                    s.setStatus(status);
                    s.setCompletedAt(LocalDateTime.now());
                    pipelineStageRepository.save(s);
                });
    }

    private void cancelStage(Long runId, StageName stageName, String logs) {
        List<PipelineStage> stages = pipelineStageRepository.findByPipelineRunId(runId);
        stages.stream()
                .filter(s -> s.getStageName() == stageName)
                .findFirst()
                .ifPresent(s -> {
                    s.setStatus(StageStatus.FAILED);
                    s.setLogs(logs);
                    pipelineStageRepository.save(s);
                });
    }

    private void updatePipelineStage(Long pipelineId, StageName stageName) {
        pipelineRepository.findById(pipelineId).ifPresent(p -> {
            p.setCurrentStage(stageName);
            pipelineRepository.save(p);
        });
    }

    private void completePipelineRun(Long runId, Long pipelineId, Long userId, PipelineStatus status) {
        PipelineRun run = pipelineRunRepository.findById(runId).orElse(null);
        Pipeline pipeline = pipelineRepository.findById(pipelineId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        if (run != null && pipeline != null && user != null) {
            List<PipelineStage> stages = pipelineStageRepository.findByPipelineRunId(runId);
            
            // Build aggregated log output
            StringBuilder aggregatedLogs = new StringBuilder();
            for (PipelineStage stage : stages) {
                aggregatedLogs.append("=== ")
                        .append(stage.getStageName())
                        .append(" ===\n")
                        .append(stage.getLogs())
                        .append("\n");
            }

            run.setStatus(status);
            run.setCompletedAt(LocalDateTime.now());
            run.setLogOutput(aggregatedLogs.toString());
            pipelineRunRepository.save(run);

            pipeline.setStatus(status);
            pipeline.setCurrentStage(null);
            pipelineRepository.save(pipeline);

            // Create notification
            NotificationType type = status == PipelineStatus.SUCCESS ? NotificationType.SUCCESS : NotificationType.ERROR;
            String message = status == PipelineStatus.SUCCESS 
                ? "CI/CD Pipeline run #" + run.getRunNumber() + " for project '" + pipeline.getProject().getName() + "' completed successfully."
                : "CI/CD Pipeline run #" + run.getRunNumber() + " for project '" + pipeline.getProject().getName() + "' FAILED.";
            notificationService.createNotification(user, message, type);
        }
    }

    private PipelineResponse mapToPipelineResponse(Pipeline p) {
        return PipelineResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .projectId(p.getProject().getId())
                .projectName(p.getProject().getName())
                .status(p.getStatus().name())
                .currentStage(p.getCurrentStage() != null ? p.getCurrentStage().name() : null)
                .build();
    }

    private PipelineRunResponse mapToRunResponse(PipelineRun r) {
        return PipelineRunResponse.builder()
                .id(r.getId())
                .pipelineId(r.getPipeline().getId())
                .pipelineName(r.getPipeline().getName())
                .runNumber(r.getRunNumber())
                .status(r.getStatus().name())
                .triggeredByUsername(r.getTriggeredBy().getUsername())
                .startedAt(r.getStartedAt())
                .completedAt(r.getCompletedAt())
                .logOutput(r.getLogOutput())
                .build();
    }

    private PipelineStageResponse mapToStageResponse(PipelineStage s) {
        return PipelineStageResponse.builder()
                .id(s.getId())
                .runId(s.getPipelineRun().getId())
                .stageName(s.getStageName().name())
                .status(s.getStatus().name())
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .logs(s.getLogs())
                .build();
    }
}
