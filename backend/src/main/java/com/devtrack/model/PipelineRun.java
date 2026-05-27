package com.devtrack.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    @Column(name = "run_number", nullable = false)
    private Long runNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PipelineStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "triggered_by_id", nullable = false)
    private User triggeredBy;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Lob
    @Column(name = "log_output", columnDefinition = "LONGTEXT")
    private String logOutput;
}
