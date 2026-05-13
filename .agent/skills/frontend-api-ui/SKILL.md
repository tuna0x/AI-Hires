---
name: frontend-api-ui
description: >
  Use this skill when adding or changing React/Vite frontend pages, API client functions,
  TanStack Query hooks, TypeScript API types, CV checker UI, interview UI, auth pages,
  dashboards, or shadcn/radix component integration in AI-Hires/Intervio.
---

# Skill: Frontend API and UI Integration

Use this for frontend work that consumes backend APIs or changes user workflows.

## Key Files

- `frontend/src/api/apiClient.ts`
- `frontend/src/api/cvApi.ts`
- `frontend/src/api/interviewApi.ts`
- `frontend/src/types/`
- `frontend/src/hooks/`
- `frontend/src/pages/`
- `frontend/src/components/`
- `frontend/src/components/ui/`

## Project Patterns

1. Keep API calls in `frontend/src/api/`.
2. Keep shared request/response types in `frontend/src/types/`.
3. Use TanStack Query hooks for server state when data is fetched, cached, polled,
   invalidated, or mutated from multiple components.
4. Keep page components focused on orchestration and layout.
5. Use existing shadcn/radix UI components before adding new primitives.
6. Use `lucide-react` icons for buttons and compact controls when appropriate.
7. Never hardcode the backend base URL in components; use `apiClient`.

## API Integration Flow

1. Read the backend controller method and DTOs first.
2. Add or update TypeScript types to match the backend `RestResponse<T>` payload.
3. Add an API function in the relevant `frontend/src/api/*Api.ts` file.
4. Add a query/mutation hook if the data has loading, error, cache, polling,
   or invalidation behavior.
5. Wire the hook into the page/component.
6. Implement loading, error, success, and empty states.

## CV and Interview UI Notes

- CV upload should handle large file upload states, failed scans, pending scans,
  and completed results.
- Interview answer submission must preserve idempotency keys across retries.
- Report and score endpoints may need polling; stop polling once terminal status is reached.
- Do not show raw AI/debug JSON to users unless the page is explicitly an admin/debug view.

## Styling Rules

- Match the existing design system and spacing.
- Avoid heavy animation unless it directly improves the workflow.
- Keep dashboard and admin views dense, scannable, and utilitarian.
- Ensure button text and labels do not overflow on mobile.
- Use accessible labels for icon-only controls.

## Verification

- [ ] `npm run lint` or `bun run lint` passes when dependencies are installed.
- [ ] `npm run build` or `bun run build` passes.
- [ ] New API calls use the shared `apiClient`.
- [ ] Components handle loading, error, empty, and success states.
- [ ] TypeScript types match backend response shape.
- [ ] Auth-required routes behave correctly after token refresh.
