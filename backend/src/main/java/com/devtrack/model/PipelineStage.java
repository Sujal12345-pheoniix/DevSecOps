package com.devtrack.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_stages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pipeline_run_id", nullable = false)
    private PipelineRun pipelineRun;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage_name", nullable = false, length = 20)
    private StageName stageName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StageStatus status;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String logs;
}
