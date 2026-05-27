package com.devtrack.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pipelines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pipeline extends AuditModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PipelineStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", length = 20)
    private StageName currentStage;
}
