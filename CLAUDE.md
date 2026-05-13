# CLAUDE.md - AI Agent Instructions

## Project Overview
Intervio (AI-Hires) is a next-generation AI Recruitment Platform designed to automate CV parsing, screening, and job description matching using Google Gemini AI, Spring Boot, and React.

## Technology Stack & Architecture
- **Backend**: Java 17/21, Spring Boot 3.4.1, Maven, JPA, MySQL, Redis, RabbitMQ, MinIO, Gemini AI API.
  - *Structure*: `Controller` -> `Service` (Heavy Logic/AI) -> `Repository`. Uses DTOs.
- **Frontend**: React 18, TypeScript, Vite, Bun, Tailwind CSS, Shadcn, Radix UI.
  - *Structure*: `api/`, `components/`, `hooks/`, `pages/`, `types/`, `lib/`.

## Essential Commands

### Backend Commands
- Build project: `mvn clean install` (Run from `backend/`)
- Run local server: `mvn spring-boot:run` (Run from `backend/`)
- Run tests: `mvn test` (Run from `backend/`)

### Frontend Commands
- Install dependencies: `bun install` or `npm install` (Run from `frontend/`)
- Start dev server: `bun run dev` (Run from `frontend/`)
- Build production: `bun run build` (Run from `frontend/`)
- Lint checks: `bun run lint` (Run from `frontend/`)
- Run tests: `bun run test` or `bun test` (Run from `frontend/`)

### Docker / Production Commands
- Start infrastructure containers locally (MySQL, Redis, RabbitMQ, MinIO):
  `docker compose -f backend/docker-compose.yml up -d`
- Deploy production containers:
  `docker compose -f backend/docker-compose.prod.yml up -d --build`

## Coding & Agentic Rules

### 🚨 Routing Rules to Specialized Instruction Files
To maintain a clean context, the core behavioral rules are categorized. You **MUST** read and follow these files before modifying code:
1. **Global Rules**: Read `.agent/rules/global.md` for general rules (auto-push with feat/fix branches, no secrets, safe edits).
2. **Backend Modification**: Read `.agent/rules/backend.md` before making edits in `backend/`.
3. **Frontend Modification**: Read `.agent/rules/frontend.md` before making edits in `frontend/`.
4. **Docs & Planning**: Read `.agent/rules/review.md` before writing plans or documentation.

### 🛠️ Specialized Agent Skills
For specific operational workflows, load and execute the appropriate instruction skills from `.agent/skills/`:
- **Setting Up Dev Environment**: Execute instructions in `.agent/skills/setup-local-dev/SKILL.md` to initialize services.
- **Adding End-to-End Features**: Execute instructions in `.agent/skills/add-feature-endpoint/SKILL.md` to correctly wire models, services, DTOs, and frontend components.
- **Managing & Debugging CV Scanning**: Execute instructions in `.agent/skills/debug-cv-scan/SKILL.md` to manage or diagnose MinIO, RabbitMQ, or Gemini API errors.
- **Managing & Debugging AI Interviews**: Execute instructions in `.agent/skills/manage-ai-interview/SKILL.md` to develop and troubleshoot the dynamic interactive Q&A and report generation pipeline.
- **Debugging Gemini Integration**: Execute instructions in `.agent/skills/debug-gemini/SKILL.md` for Gemini quota, timeout, prompt schema, malformed JSON, and AI response mapping issues.
- **Auth/JWT/RBAC Work**: Execute instructions in `.agent/skills/manage-auth-rbac/SKILL.md` for login, refresh token, Google login, Spring Security, PermissionInterceptor, and `DatabaseInitializer.syncPermissions()` changes.
- **Frontend API/UI Integration**: Execute instructions in `.agent/skills/frontend-api-ui/SKILL.md` for React pages, API clients, hooks, TypeScript response types, and user workflow UI states.
- **Production Deployment**: Execute instructions in `.agent/skills/deploy-production/SKILL.md` for Docker Compose production, GitHub Actions deploy, Nginx, Certbot, EC2, ports, and health checks.

### Core Development Style Constraints
- **Automatic Git Branching & Push**: When completing a task, create a clean branch and automatically push to GitHub:
  - Prefix with `feat/<feature-name>` for new features/functionalities.
  - Prefix with `fix/<bug-name>` for bug fixes.
- **API Permission & DatabaseInitializer**: When adding any new API endpoint in Controllers, you **MUST** register its path and HTTP method in the `syncPermissions` method inside `backend/src/main/java/com/project/AIH/config/DatabaseInitializer.java` (using a new `PermDef` item) and verify that the `PermissionInterceptor` allows access according to the dynamic RBAC configuration.
- **Layer Integrity**: Never inject business logic or AI prompt configurations directly into Controllers. Keep them in Services.
- **Strict Typing**: Always define TypeScript types/interfaces under `frontend/src/types/` for any new backend endpoint responses.
- **Error States**: UI components rendering dynamic database data must explicitly handle loading, empty, and error states.
- **Secrets Management**: Never commit API Keys, tokens, or credentials. Use environment variables via `.env` files.
- **Safety First**: Propose safe, atomic, easily reviewable changes. Do not modify multiple unrelated modules at once.
