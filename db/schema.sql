-- DevTrack Database Schema (MySQL Optimized)

CREATE DATABASE IF NOT EXISTS devtrack;
USE devtrack;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_username (username)
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_owner (owner_id)
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    assignee_id BIGINT,
    project_id BIGINT NOT NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_task_project (project_id),
    INDEX idx_task_assignee (assignee_id)
);

-- 4. Pipelines Table
CREATE TABLE IF NOT EXISTS pipelines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    project_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_stage VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_pipeline_project (project_id)
);

-- 5. Pipeline Runs Table
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pipeline_id BIGINT NOT NULL,
    run_number BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    triggered_by_id BIGINT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    log_output LONGTEXT,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (triggered_by_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_run_pipeline (pipeline_id)
);

-- 6. Pipeline Stages Table
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pipeline_run_id BIGINT NOT NULL,
    stage_name VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    logs TEXT,
    FOREIGN KEY (pipeline_run_id) REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    INDEX idx_stage_run (pipeline_run_id)
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    message VARCHAR(500) NOT NULL,
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_user (user_id)
);
