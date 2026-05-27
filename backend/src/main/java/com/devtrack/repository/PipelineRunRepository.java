package com.devtrack.repository;

import com.devtrack.model.PipelineRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineRunRepository extends JpaRepository<PipelineRun, Long> {
    List<PipelineRun> findByPipelineId(Long pipelineId);
    List<PipelineRun> findByPipelineProjectId(Long projectId);
    
    @Query("SELECT COALESCE(MAX(pr.runNumber), 0) FROM PipelineRun pr WHERE pr.pipeline.id = :pipelineId")
    Long findMaxRunNumberByPipelineId(@Param("pipelineId") Long pipelineId);

    List<PipelineRun> findTop5ByOrderByStartedAtDesc();
}
