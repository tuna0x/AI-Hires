---
name: manage-auth-rbac
description: >
  Use this skill when changing authentication, authorization, JWT refresh flow,
  Google login, Spring Security configuration, PermissionInterceptor behavior,
  Role/Permission models, DatabaseInitializer.syncPermissions, or frontend login/logout
  token handling in AI-Hires/Intervio.
---

# Skill: Manage Auth, JWT, and RBAC

Use this when touching login, refresh tokens, role permissions, protected endpoints,
or frontend auth state.

## Key Files

- Backend:
  - `backend/src/main/java/com/project/AIH/controllers/AuthenticationController.java`
  - `backend/src/main/java/com/project/AIH/services/AuthenticationService.java`
  - `backend/src/main/java/com/project/AIH/config/SecurityConfig.java`
  - `backend/src/main/java/com/project/AIH/config/PermissionInterceptor.java`
  - `backend/src/main/java/com/project/AIH/config/DatabaseInitializer.java`
  - `backend/src/main/java/com/project/AIH/models/User.java`
  - `backend/src/main/java/com/project/AIH/models/Role.java`
  - `backend/src/main/java/com/project/AIH/models/Permission.java`
- Frontend:
  - `frontend/src/api/apiClient.ts`
  - `frontend/src/pages/auth/`
  - auth components under `frontend/src/components/auth/`

## Rules

1. Treat access tokens and refresh tokens as security-sensitive.
2. Do not log JWTs, OAuth tokens, cookies, passwords, or reset tokens.
3. Public auth endpoints must be explicitly allowed in `SecurityConfig`.
4. Protected non-auth endpoints must be registered in `DatabaseInitializer.syncPermissions()`
   when they are meant to pass through `PermissionInterceptor`.
5. Every controller method still needs `@ApiMessage` per project rules.
6. Do not return entity objects directly from auth or user endpoints; use DTOs.

## Backend Change Flow

1. Identify endpoint category:
   - Public: login, register, refresh, Google login, password reset.
   - Authenticated: account, logout, user profile, role-limited APIs.
2. Update controller and service together.
3. If adding a protected endpoint, add a `PermDef` in `DatabaseInitializer.syncPermissions()`
   with the exact path pattern and HTTP method.
4. Check `PermissionInterceptor` path matching before choosing `{id}` vs `/**` patterns.
5. Keep role assignment explicit. Avoid broad ADMIN-only defaults unless intended.
6. Verify cookie attributes for refresh token behavior: `HttpOnly`, path, max age,
   `SameSite`, and secure flag behavior by environment.

## Frontend Change Flow

1. Use `frontend/src/api/apiClient.ts` for all protected API calls.
2. Store only the access token in localStorage under the existing key
   `intervio_access_token`.
3. Keep refresh-token handling centralized in the axios response interceptor.
4. On login/logout changes, verify redirect behavior for public pages and protected pages.
5. Avoid hardcoded API hosts in components; use the shared API client.

## Debug Checklist

- [ ] 401 from protected endpoint: verify Authorization header and token expiry.
- [ ] Refresh loop: verify `/api/v1/auth/refresh` is excluded from retry recursion.
- [ ] 403 from valid user: verify `PermDef`, role assignment, and path pattern.
- [ ] CORS/cookie issue: verify `withCredentials`, backend CORS config, and cookie flags.
- [ ] Google login issue: verify frontend payload shape and backend OAuth validation path.
- [ ] Logout issue: verify refresh cookie is cleared and local access token is removed.

## Verification

- [ ] Register/login returns expected `RestResponse` shape.
- [ ] Refresh renews access token without duplicate concurrent refresh calls.
- [ ] Protected endpoints reject anonymous requests.
- [ ] HR/CANDIDATE access matches `PermDef` booleans.
- [ ] No secrets or PII are printed in logs.
