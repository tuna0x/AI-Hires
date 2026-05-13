---
name: setup-local-dev
description: Setup and verify local development environment for Intervio (AI-Hires) including Docker containers, Spring Boot backend, and React frontend.
---

# Skill: Local Development Setup & Verification

This skill guides you through checking, configuring, and running the local development environment for the Intervio (AI-Hires) platform.

## Prerequisites Check
1. **Docker**: Ensure Docker Desktop is running.
2. **Java**: Ensure JDK 17 or 21 is installed (`java -version`).
3. **Node/Bun**: Ensure Node.js or Bun is installed (`bun --version` or `node -v`).

## Step-by-Step Workflow

### 1. Spin Up Infrastructure Containers
Run from the root of the project to start the backing services (MySQL, Redis, RabbitMQ, MinIO) in the background:
```bash
docker compose -f backend/docker-compose.yml up -d
```
Verify containers are healthy:
- MySQL: port 3306
- Redis: port 6379
- RabbitMQ: port 5672 (Admin Console: http://localhost:15672)
- MinIO: port 9000 (Console: http://localhost:9001)

### 2. Configure Backend Environment
1. Check if `backend/.env` exists. If not, copy from a template or create one with the following required variables:
   ```env
   SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/ai_hire?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   SPRING_DATASOURCE_USERNAME=root
   SPRING_DATASOURCE_PASSWORD=root_password
   GEMINI_API_KEY=your_gemini_api_key_here
   MINIO_ACCESS_KEY=minio_admin
   MINIO_SECRET_KEY=minio_secret_password
   ```
   > **WARNING:** The values above are EXAMPLES only. Never commit `.env` files to source control or use these simple passwords in production.
2. Verify database tables are initialized. Spring Boot uses JPA Auto-DDL to create tables on startup.

### 3. Build & Run Backend
Run from the `backend/` directory:
```bash
mvn clean install -DskipTests
mvn spring-boot:run
```
Once started, verify Swagger UI is accessible at: http://localhost:8080/swagger-ui.html

### 4. Build & Run Frontend
Run from the `frontend/` directory:
1. Install dependencies:
   ```bash
   bun install # or npm install
   ```
2. Check `frontend/.env` to ensure it points to the local backend:
   ```env
   VITE_API_URL=http://localhost:8080
   ```
3. Run dev server:
   ```bash
   bun run dev # or npm run dev
   ```
4. Access UI at: http://localhost:5173 (or default Vite port shown in console).

## Verification Checklist
- [ ] Docker containers are up and running cleanly.
- [ ] Backend starts without database or RabbitMQ connection errors.
- [ ] You can access http://localhost:8080/swagger-ui.html.
- [ ] Frontend starts and requests to `http://localhost:8080/api/v1/...` do not return CORS errors.

## Related Skills
- **Once environment is running, to add a feature**: Read `.agent/skills/add-feature-endpoint/SKILL.md`
