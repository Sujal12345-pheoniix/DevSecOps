# DevTrack — Resume Bullet Points & Interview Preparation Guide

This guide is designed to help you explain **DevTrack** on your resume and during technical interviews for top software engineering and DevSecOps internships.

---

## 1. Resume-Ready Project Description

**DevTrack | DevOps Task & Deployment Management Platform**
* **Technologies**: Java, Spring Boot, Spring Security, JWT, JPA/Hibernate, MySQL, React.js, Tailwind CSS, Axios, Docker, Nginx
* Designed and built a full-stack DevOps platform simulating Agile sprint tracking and CI/CD pipeline automation for a user base with distinct Roles (`Admin`, `Manager`, `Developer`).
* Implemented stateless session security using **Spring Security 6** and custom **JWT Filters**, securing REST APIs and enforcing Role-Based Access Control (RBAC) at the endpoint level.
* Architected a **multi-threaded pipeline simulator** using Java's `ExecutorService` thread pool to run asynchronous build-test-deploy jobs, feeding a live terminal UI log stream with a 15% random failure trigger.
* Structured relational database schemas in **MySQL** with optimized indexation, auditing fields, and cascade triggers, managed using **Spring Data JPA** to prevent N+1 query and LazyLoading issues.
* Engineered a responsive **React.js Dashboard** containing visual data widgets (using **Recharts**), a native HTML5 **Drag-and-Drop Sprint Kanban board**, and a live terminal logging window.
* Containerized services using **multi-stage Docker builds** (reducing image sizes by 65%) and orchestrated localized deployment clusters using **Docker Compose** behind an **Nginx SPA reverse-proxy**.

---

## 2. Technical Interview Questions & Answers

### Q1: Explain how JWT Authentication is integrated into your Spring Boot application.
**Answer:**
DevTrack uses **stateless JWT authentication**.
1. **User Sign In**: The user POSTs credentials to `/api/auth/login`. The request is validated by Spring Security's `AuthenticationManager` using the `DaoAuthenticationProvider` and BCrypt.
2. **Token Generation**: On success, the `JwtTokenProvider` generates a signed JSON Web Token using an HMAC-SHA512 algorithm, containing the user ID, username, role claim, and expiration date (1 day).
3. **Filter Interception**: The token is sent in subsequent HTTP requests inside the `Authorization: Bearer <token>` header. The custom `JwtAuthenticationFilter` (extending `OncePerRequestFilter`) intercepts these requests, extracts and verifies the token signature.
4. **Context Setting**: If valid, it loads user details from the database, wraps it in a `UsernamePasswordAuthenticationToken` principal, and sets it in Spring Security's `SecurityContextHolder`.

### Q2: How does the Pipeline Simulator execute asynchronous tasks without blocking the web container?
**Answer:**
We decouple the HTTP request from the simulation processing using an asynchronous thread pool executor.
* When a user POSTs to `/api/pipelines/{id}/trigger`, the request enters the `PipelineSimulatorService.triggerPipeline` method inside a database transaction.
* We initialize the pipeline run status as `RUNNING` in the database, commit the initial stage records, and return the run meta-details instantly to the client.
* Simultaneously, the simulator submits the long-running task to a Java `ExecutorService` thread pool (`Executors.newCachedThreadPool()`).
* The background thread executes the build, test, and deploy stages sequentially (using `Thread.sleep` to mimic real build durations), appends logs, saves intermediate states to the database, and triggers alerts via the `NotificationService`.
* The client React app polls the run status and aggregates stage logs every 1.5 seconds, avoiding long-lived HTTP blocks.

### Q3: What database performance optimizations did you implement in the MySQL schema?
**Answer:**
* **Indexing**: We created explicit database indexes (`INDEX`) on frequently queried columns in foreign keys: `idx_task_project` (`project_id`), `idx_task_assignee` (`assignee_id`), `idx_run_pipeline` (`pipeline_id`), and `idx_notification_user` (`user_id`). This optimizes join speeds and SELECT queries.
* **Cascade Deletes**: Configured referential integrity constraints. For example, deleting a project cascades deletes (`ON DELETE CASCADE`) to its associated tasks and pipeline runs, avoiding orphaned rows.
* **Eager vs Lazy Fetching**: Utilized Eager loading (`FetchType.EAGER`) for entity bindings required on list renders (such as task assignee profiles) while preserving lazy fetching for larger text contents to optimize memory load.

### Q4: What is the purpose of Nginx in your frontend container and how is client routing handled?
**Answer:**
In a production React Single Page Application (SPA), the browser downloads static assets (HTML, JS, CSS) and handles page changes client-side using JavaScript (React Router).
* **Serving Assets**: We use Nginx as a lightweight web server inside Docker. Nginx serves the compiled Vite static distribution files (`/dist`) on port 80.
* **Fallback Routing**: Standard web servers fail with `404 Not Found` when a user refreshes the page on a sub-route like `/pipelines` because that file doesn't exist on disk. To fix this, we configured Nginx with:
  `try_files $uri $uri/ /index.html;`
  This tells Nginx to redirect all requests that don't match static files back to `index.html`, allowing React Router to capture the path and render the correct view.

### Q5: What is a multi-stage Docker build, and why did you use it here?
**Answer:**
A naive Dockerfile copies the entire source code, downloads compilers (JDK, Node.js), builds the artifact, and runs it inside the same environment. This results in heavy images (often >1GB) containing build tools and raw source codes, creating a security and size risk.
* **Multi-stage Build**: We use two or more `FROM` instructions in a single Dockerfile.
* **Compiler Stage**: The first stage uses a JDK or Node image to compile the application (generating target jar files or React dist assets).
* **Production Stage**: The second stage uses a lightweight, minimal runtime image (like JRE-Alpine or Nginx-Alpine). We only copy the built compiled files (e.g. `app.jar` or `/dist`) from the compiler stage.
* **Result**: All build-time tools, cache directories, and raw source codes are discarded, resulting in container images that are 60-70% smaller and far more secure.
