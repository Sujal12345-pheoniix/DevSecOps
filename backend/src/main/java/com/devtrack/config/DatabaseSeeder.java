package com.devtrack.config;

import com.devtrack.dto.ProjectRequest;
import com.devtrack.dto.TaskRequest;
import com.devtrack.model.NotificationType;
import com.devtrack.model.Role;
import com.devtrack.model.User;
import com.devtrack.repository.UserRepository;
import com.devtrack.service.NotificationService;
import com.devtrack.service.ProjectService;
import com.devtrack.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private NotificationService notificationService;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // 1. Seed Users (default password: 'password123')
            User admin = User.builder()
                    .username("admin")
                    .email("admin@devtrack.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.ROLE_ADMIN)
                    .build();

            User manager = User.builder()
                    .username("manager")
                    .email("manager@devtrack.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.ROLE_MANAGER)
                    .build();

            User developer = User.builder()
                    .username("developer")
                    .email("developer@devtrack.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.ROLE_DEVELOPER)
                    .build();

            admin = userRepository.save(admin);
            manager = userRepository.save(manager);
            developer = userRepository.save(developer);

            // 2. Seed Projects (pipelines automatically generated)
            ProjectRequest proj1 = new ProjectRequest();
            proj1.setName("Cloud Native API");
            proj1.setDescription("Microservice platform deployment on AWS Elastic Kubernetes Service (EKS).");
            var p1 = projectService.createProject(proj1, manager.getId());

            ProjectRequest proj2 = new ProjectRequest();
            proj2.setName("Legacy Migration");
            proj2.setDescription("Porting monolithic enterprise apps to modern Spring Boot apps.");
            var p2 = projectService.createProject(proj2, manager.getId());

            // 3. Seed Tasks
            TaskRequest t1 = new TaskRequest();
            t1.setTitle("Dockerize Spring App");
            t1.setDescription("Write a multi-stage Dockerfile and test local builds.");
            t1.setStatus("COMPLETED");
            t1.setPriority("HIGH");
            t1.setAssigneeId(developer.getId());
            t1.setProjectId(p1.getId());
            t1.setDueDate(LocalDate.now().plusDays(5));
            taskService.createTask(t1);

            TaskRequest t2 = new TaskRequest();
            t2.setTitle("Configure CI/CD Pipelines");
            t2.setDescription("Set up GitHub Actions or Jenkins to automate build-test-deploy.");
            t2.setStatus("IN_PROGRESS");
            t2.setPriority("MEDIUM");
            t2.setAssigneeId(developer.getId());
            t2.setProjectId(p1.getId());
            t2.setDueDate(LocalDate.now().plusDays(15));
            taskService.createTask(t2);

            TaskRequest t3 = new TaskRequest();
            t3.setTitle("Audit Database Schemas");
            t3.setDescription("Analyze indexes and resolve foreign key constraints issues.");
            t3.setStatus("TODO");
            t3.setPriority("LOW");
            t3.setAssigneeId(developer.getId());
            t3.setProjectId(p2.getId());
            t3.setDueDate(LocalDate.now().plusDays(25));
            taskService.createTask(t3);

            // 4. Seed Notification
            notificationService.createNotification(
                    developer,
                    "Welcome to DevTrack! You have been assigned the task 'Dockerize Spring App'.",
                    NotificationType.INFO
            );
        }
    }
}
