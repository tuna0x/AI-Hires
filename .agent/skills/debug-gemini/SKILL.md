---
name: debug-gemini
description: >
  Use this skill when changing or debugging Gemini AI calls in AI-Hires/Intervio.
  Triggers include malformed JSON, markdown-wrapped JSON, Gemini 429 or quota errors,
  timeout failures, prompt/schema drift, model configuration changes, WebClient errors,
  or any edits to GeminiService.java and AI prompt/response mapping code.
---

# Skill: Debug Gemini Integration

Use this as the shared Gemini troubleshooting guide for CV scanning, interview question
generation, answer scoring, and final report generation.

## Key Files

- `backend/src/main/java/com/project/AIH/services/GeminiService.java`
- `backend/src/main/java/com/project/AIH/services/ScoringResultValidator.java`
- `backend/src/main/java/com/project/AIH/services/ScanMapperService.java`
- `backend/src/main/java/com/project/AIH/services/InterviewService.java`
- DTOs under `backend/src/main/java/com/project/AIH/dto/`

## Standard Debug Flow

1. Identify the exact AI caller: CV parsing, CV scoring, question generation, answer scoring,
   or interview report generation.
2. Inspect logs around `GeminiService` first. Capture status code, response body shape,
   timeout, and mapper exception without logging PII or secrets.
3. Verify the request config:
   - API key is present but never printed.
   - Temperature stays low (`0.1` to `0.2`) for structured JSON.
   - Structured calls request JSON output where supported.
   - Prompt contains the full expected schema and exact enum/label values.
4. Validate the raw response before mapping:
   - Strip markdown fences only as a defensive fallback.
   - Fail with a clear `failure_code` when required fields are absent.
   - Do not silently default scores or arrays unless the product behavior explicitly accepts it.
5. Confirm persistence path after a valid response:
   - CV scan: validator -> mapper -> `resume_scans` and child tables.
   - Interview: session/question/report entities and score status endpoints.

## Common Failures

### 429 or quota errors

- Confirm retry/backoff is active at the caller or worker level.
- Reduce concurrent worker consumption before adding more retries.
- Preserve idempotency so retries do not create duplicate DB rows.

### Malformed JSON

- Compare the actual response with the DTO shape.
- Tighten the prompt with exact JSON schema and no optional narrative.
- Keep Vietnamese or JD/CV text UTF-8 clean before prompt injection.
- Add one focused regression test around the mapper or parser if the bug is reproducible.

### Token or prompt overflow

- Truncate large CV/JD text at a domain-appropriate boundary.
- Prefer summaries or selected fields over sending entire persisted objects.
- Keep user-provided content separated from schema instructions.

### WebClient/network errors

- Check timeout settings and error mapping in `GeminiService`.
- Preserve the upstream status and a sanitized message in internal logs.
- Return a product-level failure state rather than leaving async work stuck in `PENDING`.

## Verification Checklist

- [ ] Gemini failure paths set a visible failed/processing status for the user-facing workflow.
- [ ] Raw response mapping is covered by focused tests or a local reproduction.
- [ ] No API keys, tokens, full CV text, or private interview answers are logged.
- [ ] CV/interview callers still receive the exact DTO shape expected by frontend APIs.
- [ ] Async workers remain idempotent under retry and message redelivery.

## Related Skills

- CV scan pipeline: `.agent/skills/debug-cv-scan/SKILL.md`
- Interview pipeline: `.agent/skills/manage-ai-interview/SKILL.md`
