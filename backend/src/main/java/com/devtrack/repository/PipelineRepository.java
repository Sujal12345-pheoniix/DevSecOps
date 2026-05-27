package com.devtrack.repository;

import com.devtrack.model.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
    Optional<Pipeline> findByProjectId(Long projectId);
}
