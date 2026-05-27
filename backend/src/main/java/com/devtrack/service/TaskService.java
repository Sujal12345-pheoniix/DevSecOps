package com.devtrack.service;

import com.devtrack.dto.TaskRequest;
import com.devtrack.dto.TaskResponse;
import com.devtrack.exception.BadRequestException;
import com.devtrack.exception.ResourceNotFoundException;
import com.devtrack.model.*;
import com.devtrack.repository.ProjectRepository;
import com.devtrack.repository.TaskRepository;
import com.devtrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found with id: " + request.getAssigneeId()));
        }

        TaskStatus status;
        try {
            status = TaskStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid status. Allowed: TODO, IN_PROGRESS, IN_REVIEW, COMPLETED");
        }

        TaskPriority priority;
        try {
            priority = TaskPriority.valueOf(request.getPriority().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid priority. Allowed: LOW, MEDIUM, HIGH");
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(status)
                .priority(priority)
                .assignee(assignee)
                .project(project)
                .dueDate(request.getDueDate())
                .build();

        Task savedTask = taskRepository.save(task);

        // Send Notification if assigned
        if (assignee != null) {
            notificationService.createNotification(
                    assignee,
                    "You have been assigned a new task: '" + savedTask.getTitle() + "' in project '" + project.getName() + "'",
                    NotificationType.INFO
            );
        }

        return mapToResponse(savedTask);
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found with id: " + request.getAssigneeId()));
        }

        TaskStatus status;
        try {
            status = TaskStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid status. Allowed: TODO, IN_PROGRESS, IN_REVIEW, COMPLETED");
        }

        TaskPriority priority;
        try {
            priority = TaskPriority.valueOf(request.getPriority().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid priority. Allowed: LOW, MEDIUM, HIGH");
        }

        User oldAssignee = task.getAssignee();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(status);
        task.setPriority(priority);
        task.setAssignee(assignee);
        task.setDueDate(request.getDueDate());

        Task updatedTask = taskRepository.save(task);

        // Notify new assignee if changed
        if (assignee != null && (oldAssignee == null || !oldAssignee.getId().equals(assignee.getId()))) {
            notificationService.createNotification(
                    assignee,
                    "Task assigned to you: '" + updatedTask.getTitle() + "'",
                    NotificationType.INFO
            );
        }

        return mapToResponse(updatedTask);
    }

    public List<TaskResponse> getTasksByProjectId(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByAssigneeId(Long assigneeId) {
        return taskRepository.findByAssigneeId(assigneeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return mapToResponse(task);
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeUsername(task.getAssignee() != null ? task.getAssignee().getUsername() : null)
                .projectId(task.getProject().getId())
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .build();
    }
}
