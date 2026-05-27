package com.devtrack.service;

import com.devtrack.dto.ProjectRequest;
import com.devtrack.dto.ProjectResponse;
import com.devtrack.exception.ResourceNotFoundException;
import com.devtrack.model.Pipeline;
import com.devtrack.model.PipelineStatus;
import com.devtrack.model.Project;
import com.devtrack.model.User;
import com.devtrack.repository.PipelineRepository;
import com.devtrack.repository.ProjectRepository;
import com.devtrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();

        Project savedProject = projectRepository.save(project);

        // Auto-create a Pipeline for this project
        Pipeline pipeline = Pipeline.builder()
                .name(savedProject.getName() + " CI/CD Pipeline")
                .project(savedProject)
                .status(PipelineStatus.IDLE)
                .build();
        pipelineRepository.save(pipeline);

        return mapToResponse(savedProject);
    }

    public List<ProjectResponse> getProjectsByOwner(Long ownerId) {
        return projectRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToResponse(project);
    }

    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        pipelineRepository.findByProjectId(id).ifPresent(pipelineRepository::delete);
        projectRepository.deleteById(id);
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerId(project.getOwner().getId())
                .ownerUsername(project.getOwner().getUsername())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
