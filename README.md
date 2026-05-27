# DevTrack — DevOps Task & Deployment Management Platform

DevTrack is a production-level, full-stack DevSecOps portal that integrates Agile sprint tracking with a simulated CI/CD deployment pipeline engine. Built with a modern enterprise architecture, it showcases role-based access control (RBAC), JWT authentication, asynchronous event logs, and dockerized deployments.

---

## Technical Stack
* **Backend**: Java 17, Spring Boot 3.2, Spring Security 6, Spring Data JPA, Hibernate ORM, MySQL.
* **Frontend**: React.js, Tailwind CSS, Axios, React Router DOM, Recharts (analytics), Lucide React.
* **Orchestration**: Docker, Docker Compose, Nginx.
* **Documentation**: Swagger UI / OpenAPI 3.

---

## Directory Structure
```text
DevSecOps/
├── backend/
│   ├── src/main/java/com/devtrack/
│   │   ├── config/          # Web Security, CORS, Database seeding
│   │   ├── controller/      # Auth, Projects, Tasks, Pipelines, Notifications
│   │   ├── dto/             # API Request/Response Transfer objects
│   │   ├── exception/       # Controller Advices and custom errors
│   │   ├── model/           # Hibernate Entities and Auditing models
│   │   ├── repository/      # JPA Data repositories
│   │   ├── security/        # JWT utilities, user principals, filters
│   │   └── service/         # Pipelines simulation logic, auth, notifications
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/      # Navigation, layouts, ProtectedRoutes, toasts
│   │   ├── context/         # Authentication and Notification contexts
│   │   ├── pages/           # Dashboard, Sprint Board, Pipelines, Settings
│   │   └── services/        # Axios API instances
│   ├── Dockerfile
│   ├── tailwind.config.js
│   └── nginx.conf
├── db/
│   ├── schema.sql           # Database schema definition
│   └── data.sql             # SQL Seed mock data script
└── docker-compose.yml
```

---

## Core Features
1. **User Authentication & RBAC**: Users register and login using stateless JWT session tokens. Three roles (`ADMIN`, `MANAGER`, `DEVELOPER`) enforce access permissions at the API route level.
2. **Project Registry**: Provisioning projects automatically binds a unique CI/CD pipeline instance in the simulator database.
3. **Sprint Kanban Board**: Agile board that updates task columns (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`) using native drag-and-drop actions.
4. **Pipeline Simulation Terminal**: Trigger pipeline runs containing `BUILD`, `TEST`, and `DEPLOY` stages. Displays real-time terminal outputs from a background thread pool, with simulated random test failures.
5. **Real-time Alert Notifications**: Notifications trigger immediately upon pipeline completion/failure or task assignments. An active polling toast manager notifies active user sessions.

---

## Quick Start (Dockerized)

### Prerequisites
* Docker and Docker Compose installed.

### Steps
1. Clone or navigate to the workspace:
   ```bash
   cd DevSecOps
   ```
2. Build and run containers:
   ```bash
   docker-compose up --build
   ```
3. Once running:
   * **Frontend UI**: Browse to `http://localhost:3000`
   * **Backend REST API**: Runs on `http://localhost:8080`
   * **API Docs (Swagger)**: View at `http://localhost:8080/swagger-ui.html`

*The database is automatically created, migration schemas are updated by Hibernate, and default developer accounts are seeded on start.*

---

## Quick Start (Manual Local Build)

### 1. Database Setup
* Ensure MySQL is running on port 3306.
* Open a MySQL client and run the setup scripts:
  ```sql
  source db/schema.sql;
  source db/data.sql;
  ```
  *(Or let Hibernate auto-create on startup; default settings connect via root/root).*

### 2. Backend Boot
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Build and compile dependencies:
   ```bash
   mvn clean package -DskipTests
   ```
3. Run the Spring Boot application:
   ```bash
   java -jar target/devtrack-backend-0.0.1-SNAPSHOT.jar
   ```

### 3. Frontend Boot
1. Open a new terminal and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install libraries:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the portal at `http://localhost:5173`.

---

## Default Seed Credentials
Seed credentials share the password `password123`:
* **Admin Role**: `admin`
* **Manager Role**: `manager`
* **Developer Role**: `developer`

---

## API Endpoints List

### Authentication
* `POST /api/auth/register`: Create user credentials.
* `POST /api/auth/login`: Authenticate and return JWT token.
* `GET /api/auth/users`: List registry users (Required for task assignment).

### Projects
* `POST /api/projects`: Register a new project.
* `GET /api/projects`: Fetch all projects.
* `GET /api/projects/my`: List projects owned by the caller.
* `DELETE /api/projects/{id}`: Delete project, pipelines, and tasks.

### Sprint Tasks
* `POST /api/tasks`: Create task.
* `PUT /api/tasks/{id}`: Edit details or move column status.
* `GET /api/tasks/project/{projectId}`: List tasks in a project.
* `GET /api/tasks/assignee/{assigneeId}`: List tasks assigned to developer.
* `DELETE /api/tasks/{id}`: Remove task.

### Pipelines
* `GET /api/pipelines`: List projects pipelines.
* `POST /api/pipelines/{id}/trigger`: Trigger asynchronous simulator job.
* `GET /api/pipelines/{id}/runs`: Get execution history list.
* `GET /api/pipelines/runs/{runId}/stages`: Get stage status details and logs.
* `GET /api/pipelines/recent-deployments`: Fetch top 5 recent jobs.
