---
name: manage-ai-interview
description: >
  Use this skill when modifying or debugging the AI-driven interview pipeline in Intervio.
  Triggers include: changes to InterviewSession state machine, Q&A answer submission logic,
  idempotency key handling, Gemini question generation prompts, InterviewReport generation,
  or any endpoint under /api/v1/interviews/**. Also use when mock vs. real interview
  session behavior diverges unexpectedly, or when session status gets stuck in IN_PROGRESS.
---
 
# Skill: Managing & Developing the AI Interview Workflow
 
This skill defines the operational logic, state machines, and AI prompt workflows for the
dynamic Mock and Real Interview session pipeline in Intervio.
 
---
 
## 1. High-Level Architecture & Flow
 
The AI Interview flow is highly interactive and state-driven:
 
### Step 1 — Session Initialization
- **Real interview**: `POST /api/v1/interviews/start`
  - Requires an active job application. Backend extracts JD text from the linked posting,
    calls Gemini to pre-generate core technical + behavioral questions, and saves them as
    `InterviewQuestion` rows linked to the new `InterviewSession`.
- **Mock interview**: `POST /api/v1/interviews/start-mock`
  - No job application required. Uses historical `ResumeScan` data as context instead of a JD.
  - Key difference: mock sessions skip employer-side visibility and do not affect application status.
- Both endpoints initialize `InterviewSession` with `status = IN_PROGRESS`.
### Step 2 — Interactive Q&A Loop
- Frontend displays one question at a time from the pre-generated list.
- Candidate submits answer via `POST /api/v1/interviews/{sessionId}/answer`.
- Backend records the answer to `InterviewQuestion.userAnswer`, optionally scores it live
  via Gemini (configurable), and returns the next question.
- **Idempotency**: Each answer submission must include either:
  - Header: `X-Idempotency-Key: <uuid>`
  - Or body field: `"idempotencyKey": "<uuid>"`
  - If a request with the same key is received again, the backend returns the cached result
    without invoking Gemini or writing a new DB row.
### Step 3 — Session Completion
- `POST /api/v1/interviews/{sessionId}/finish`
- Transitions `InterviewSession.status` → `COMPLETED`.
- Asynchronously triggers `InterviewService.generateReport()` which calls Gemini to produce
  the final structured `InterviewReport`.
### Step 4 — Report Fetching
- `GET /api/v1/interviews/{sessionId}/report`
- Frontend should poll this endpoint (e.g. every 3–5 seconds) until report status is ready.
- Returns comprehensive feedback, category scores, strengths, weaknesses, and improvement plan.
---
 
## 2. Key Code Files & Database Models
 
### Controllers & Services
| File | Purpose |
|---|---|
| `backend/src/main/java/com/project/AIH/controllers/InterviewController.java` | HTTP routing for all interview endpoints |
| `backend/src/main/java/com/project/AIH/services/InterviewService.java` | Orchestrates question generation, answer scoring, and report building |
| `backend/src/main/java/com/project/AIH/services/GeminiService.java` | All Gemini API calls (question gen, scoring, report) |
 
### Entities (`backend/src/main/java/com/project/AIH/models/`)
| Entity | Key Fields |
|---|---|
| `InterviewSession` | `status` (IN_PROGRESS / COMPLETED), `overallScore`, FK to candidate & resume |
| `InterviewQuestion` | `questionText`, `expectedCriteria`, `userAnswer`, `aiScore` |
| `InterviewReport` | `overallRating`, `strengths`, `weaknesses`, `improvementPlan`, `categoryScores` |
 
---
 
## 3. Developing and Extending the Feature
 
### Adding a New Question Type
1. Add the new type to the `QuestionType` enum (e.g. `SITUATIONAL`, `TECHNICAL`, `BEHAVIORAL`).
2. Update the Gemini prompt template in `InterviewService.buildQuestionGenerationPrompt()` to
   instruct Gemini to generate questions of the new type. Example snippet:
   ```
   Generate 2 SITUATIONAL questions based on the following JD: {jdText}
   Return JSON array: [{"type": "SITUATIONAL", "text": "...", "expectedCriteria": "..."}]
   ```
3. Ensure the new type is handled in `InterviewService.scoreAnswer()` if scoring logic differs.
### Gemini Prompt Guidelines
- Always set temperature `0.1`–`0.2` to reduce hallucination and ensure schema consistency.
- Set `responseMimeType = application/json` for structured outputs.
- Clean all Vietnamese text to UTF-8 before injecting into prompt templates — mojibake in
  prompts causes Gemini to return malformed JSON.
- Never rely on Gemini to infer output structure; always specify the exact JSON schema in
  the prompt system instruction.
### State Machine Rules
- **Never** skip the `IN_PROGRESS → COMPLETED` transition; always go through `/finish`.
- Do not add intermediate statuses without updating all status-check conditionals in
  `InterviewService` and the frontend polling logic.
- If a session must be force-reset (e.g. for testing), update `status` directly in DB and
  delete related `InterviewReport` rows before re-triggering.
### Retry Logic for Stuck Reports
If a report is stuck in `PROCESSING` and needs to be manually re-triggered:
1. Verify the session is `COMPLETED` in DB.
2. Delete the existing `InterviewReport` row for the session.
3. Call `InterviewService.generateReport(sessionId)` directly via an admin endpoint or
   integration test to re-trigger Gemini report generation.
---
 
## 4. Troubleshooting & Debugging Guide
 
### Issue A: Questions are not generating or session starts empty
1. Verify the target Resume or JD contains extractable text. If JD text extraction
   (`/extract-text`) fails, the Gemini prompt context will be blank → zero questions generated.
2. Check `GeminiService` logs for connection timeouts or JSON mapping exceptions during
   question list parsing.
3. Confirm `InterviewSession` row was created and `status = IN_PROGRESS` in DB.
4. If mock interview, verify a `ResumeScan` with `status = COMPLETED` exists for the user.
### Issue B: Duplicate answers recorded or session gets stuck mid-Q&A
1. Confirm the client sends a unique `X-Idempotency-Key` per answer submission and that the
   same key is reused on retry (not regenerated).
2. Check if a transactional rollback is occurring on answer save due to constraint violations
   on `InterviewQuestion` child entity collections.
3. Look for DB deadlocks if concurrent requests hit the same session.
### Issue C: Final Report stuck in PROCESSING
1. Check console logs for exceptions in `InterviewService.generateReport()` or
   `GeminiService` — common causes are Gemini rate limits (429) or token limit overruns.
2. If Gemini returned a response but it was malformed, check if `ObjectMapper` threw a parse
   exception when mapping the report JSON to `InterviewReport`.
3. Verify the `InterviewReport` entity was not partially saved (orphan rows with null fields).
4. To manually retry: see "Retry Logic for Stuck Reports" in Section 3 above.
---
 
## 5. Verification Checklist
- [ ] Session initializes successfully and returns the pre-generated question list.
- [ ] Real vs. mock session uses the correct context source (JD text vs. ResumeScan).
- [ ] Submitting answers resolves without DB locking or duplicated rows.
- [ ] Idempotency key correctly blocks duplicate network retries.
- [ ] Finishing the session transitions status to `COMPLETED` and triggers Gemini report.
- [ ] Report polling returns structured data correctly once Gemini finishes.
- [ ] Gemini prompts use UTF-8 clean input, low temperature, and `application/json` mime type.
---
 
## Related Skills
- **Adding a new Interview API endpoint**: `.agent/skills/add-feature-endpoint/SKILL.md`
- **Debugging Gemini API issues**: `.agent/skills/debug-gemini/SKILL.md` (if available)