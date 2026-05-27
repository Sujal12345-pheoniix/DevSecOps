-- DevTrack Seed Data (PostgreSQL Compatible)

-- 1. Insert Seed Users
-- Password is 'password123' (BCrypt hashed)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@devtrack.com', '$2a$10$X5t.dD8K6iS15zK5R9aJXeCqIqLqP0NfQ12F7oGq0.u5tQ8E1l6aW', 'ROLE_ADMIN'),
('manager', 'manager@devtrack.com', '$2a$10$X5t.dD8K6iS15zK5R9aJXeCqIqLqP0NfQ12F7oGq0.u5tQ8E1l6aW', 'ROLE_MANAGER'),
('developer', 'developer@devtrack.com', '$2a$10$X5t.dD8K6iS15zK5R9aJXeCqIqLqP0NfQ12F7oGq0.u5tQ8E1l6aW', 'ROLE_DEVELOPER');

-- 2. Insert Seed Projects
INSERT INTO projects (name, description, owner_id) VALUES
('Cloud Native API', 'Microservice platform deployment on AWS Elastic Kubernetes Service (EKS).', 2),
('Legacy Migration', 'Porting monolithic enterprise apps to modern Spring Boot apps.', 2);

-- 3. Insert Pipelines
INSERT INTO pipelines (name, project_id, status) VALUES
('Cloud Native API CI/CD Pipeline', 1, 'SUCCESS'),
('Legacy Migration CI/CD Pipeline', 2, 'IDLE');

-- 4. Insert Tasks for Projects
INSERT INTO tasks (title, description, status, priority, assignee_id, project_id, due_date) VALUES
('Dockerize Spring App', 'Write a multi-stage Dockerfile and test local builds.', 'COMPLETED', 'HIGH', 3, 1, '2026-06-01'),
('Configure CI/CD Pipelines', 'Set up GitHub Actions or Jenkins to automate build-test-deploy.', 'IN_PROGRESS', 'MEDIUM', 3, 1, '2026-06-15'),
('Audit Database Schemas', 'Analyze indexes and resolve foreign key constraints issues.', 'TODO', 'LOW', 3, 2, '2026-06-25'),
('Setup Spring Security', 'Integrate JWT filters and setup role authorization guards.', 'COMPLETED', 'HIGH', 3, 1, '2026-05-30');

-- 5. Insert Notifications for Seed
INSERT INTO notifications (user_id, message, read_status, type) VALUES
(3, 'Welcome to DevTrack! You have been assigned the task "Dockerize Spring App".', TRUE, 'INFO'),
(3, 'Alert: Cloud Native API CI/CD Pipeline Build SUCCESS.', FALSE, 'SUCCESS');
