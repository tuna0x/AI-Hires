---
name: add-feature-endpoint
description: Guides the agent on how to correctly add an end-to-end feature or API endpoint, spanning from the database up to the React frontend UI.
---

# Skill: Adding an End-to-End Feature/Endpoint

This skill defines the standard workflow for adding new database-driven features or API endpoints to Intervio (AI-Hires), ensuring consistency across backend layers and frontend components.

## Step-by-Step Workflow

### Phase 1: Database & Model (JPA)
1. If the feature requires database schema changes, check if there are database creation scripts or if Spring Boot JPA Auto-DDL handles it.
2. Define or modify the JPA Entity in `backend/src/main/java/com/project/AIH/models/`.
   - Use Lombok annotations carefully (`@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`). Avoid `@Data` on entity classes to prevent circular dependency issues in `hashCode`/`toString`.
   - Ensure foreign keys are appropriately mapped using `@ManyToOne`, `@OneToMany`, or `@OneToOne` with proper cascade types.

### Phase 2: Repository Layer
1. Create a Repository interface in `backend/src/main/java/com/project/AIH/repositories/` extending `JpaRepository<EntityName, IDType>`.
2. Define custom queries using Spring Data method names or `@Query` annotations if complex retrieval is needed.

### Phase 3: DTOs & Mappers
1. Create Data Transfer Objects (DTOs) in `backend/src/main/java/com/project/AIH/dto/` for both requests (e.g., `CreateFeatureRequest`) and responses (e.g., `FeatureResultDTO`).
2. Write or update converters/mappers. If using MapStruct or manual mapping, ensure lazy-loaded entity properties are handled without trigger-loading full relationships where not needed.

### Phase 4: Service Layer (Business Logic)
1. Write the interface or implementation class under `backend/src/main/java/com/project/AIH/services/`.
2. Keep business logic and heavy computations (such as Gemini prompts, data crunching, and messaging) inside Services.
3. Use `@Transactional` for services modifying multiple rows or entities.

### Phase 5: Controller Layer (REST API)
1. Create/Modify the Controller under `backend/src/main/java/com/project/AIH/controllers/`.
2. Annotate with `@RestController` and `@RequestMapping("/api/v1/your-feature")`.
3. Use standard HTTP verbs:
   - `GET` to retrieve resource(s).
   - `POST` to create resources.
   - `PUT`/`PATCH` to update.
   - `DELETE` to remove.
4. Integrate Swagger annotations (`@Operation`, `@ApiResponse`) to keep the API documentation updated.
5. Inject Spring Security controls if permission-based or role-based restriction is needed.

### Phase 5.5: API Permissions & DatabaseInitializer Registration
This is a **CRITICAL** step because `PermissionInterceptor` will block non-ADMIN users if permissions aren't initialized:
1. Open `backend/src/main/java/com/project/AIH/config/DatabaseInitializer.java`.
2. Locate the `syncPermissions` method.
3. Register the new endpoint by adding a new `PermDef` item to the `perms` list:
   - Provide name, path, HTTP method, module name.
   - Set boolean parameters `toHr` and `toCandidate` to define role access (e.g., `true` if HR should have access, `false` otherwise).
4. Verify that `PermissionInterceptor.java` handles requests correctly based on this dynamic RBAC mapping.

### Phase 6: Frontend - API, Types & Hooks
1. **Define Types**: Add TS types/interfaces for the new response and request objects in `frontend/src/types/`.
2. **Add API Endpoint**: Define axios or custom fetch function under `frontend/src/api/` or inside relevant service file.
3. **Create custom Hook**: Add React-Query mutation/query hook in `frontend/src/hooks/` for fetching data, caching, or cache invalidation.

### Phase 7: Frontend - Component & Pages
1. Use the custom hook inside React components under `frontend/src/components/` or page views under `frontend/src/pages/`.
2. Handle all states: Loading, Error, Success, and Empty states.
3. Use Shadcn components for premium aesthetic design.

### Phase 8: Automatic Git Branching & Push
Once the code compiles, passes tests, and satisfies all requirements:
1. Identify if this is a new feature or a bug fix.
2. Create and switch to a clean branch with the appropriate prefix:
   - New Feature: `feat/<feature-name>`
   - Bug Fix: `fix/<bug-name>`
3. Commit all changes with a clean, descriptive message.
4. Automatically **push** the branch to GitHub (`git push -u origin <branch-name>`).

## Verification Checklist
- [ ] Backend endpoint compiles and starts.
- [ ] Swagger UI lists the new endpoint and request/response structures are correct.
- [ ] The API path, HTTP method, and role bindings have been registered in `DatabaseInitializer.java` (`syncPermissions`).
- [ ] Tests are updated or written for the new Service/Controller logic.
- [ ] Frontend imports and maps the new backend types.
- [ ] UI behaves gracefully under poor network conditions (shows loading spinners, error alerts).
- [ ] Branch is created with `feat/` or `fix/` prefix, committed, and successfully pushed to GitHub.

## Related Skills
- **If the feature involves CV Scanning**: Read `.agent/skills/debug-cv-scan/SKILL.md`
- **If the feature involves AI Interviews**: Read `.agent/skills/manage-ai-interview/SKILL.md`
