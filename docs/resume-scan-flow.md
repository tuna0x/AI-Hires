# Resume Scan Flow (Backend) + Prompt Review

This document describes the end-to-end data flow for CV scan in the backend: where data is read from, what is computed, and where results are stored.

Date: 2026-05-12

## 1. High-Level Flow

1. Client uploads a file to `POST /api/v1/resume-scans`.
2. Backend validates file type/size, uploads the file to MinIO, creates a `resume_scans` record (status `PENDING`).
3. Backend writes an outbox row (`outbox_messages`, status `PENDING`) containing a JSON payload (`ResumeScanMessage`).
4. `OutboxRelayWorker` relays outbox messages to RabbitMQ exchange `cv.parsing.exchange` with routing key `cv.parsing.routing.key`.
5. `ResumeScanWorker` consumes `cv.parsing.queue`:
   - Sets scan status to `EXTRACTING` then `ANALYZING` (committed early).
   - Downloads file from MinIO.
   - Extracts text via Apache Tika.
   - Calls Gemini to produce ATS JSON (vision-first or text-only).
   - Validates/normalizes scores and enriches computed gaps.
   - Persists raw AI JSON (`resume_scan_raw_ai_output.ats_json`).
   - Maps JSON into structured columns + child tables (`scan_sub_scores`, `scan_actions`).
   - Marks scan `COMPLETED` (or `FAILED` with failure details).
6. Client polls `GET /api/v1/resume-scans/{id}` to receive status + results.

## 2. Entry Point: API Layer

**Controller**
- `backend/src/main/java/com/project/AIH/controllers/ResumeScanController.java`
  - `POST /api/v1/resume-scans` -> `ResumeScanService.createScan(...)`
  - `GET /api/v1/resume-scans/{id}` -> `ResumeScanService.getScanResult(...)`
  - `POST /api/v1/resume-scans/{id}/feedback` -> `ResumeScanService.submitFeedback(...)`

**Service**
- `backend/src/main/java/com/project/AIH/services/ResumeScanService.java`
  - Validates the uploaded file:
    - `max 50MB` (server-side check)
    - mime types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
    - detection via Apache Tika
  - Uploads to MinIO via `FileService.uploadFile(...)`.
  - Creates `ResumeScan` row:
    - `status=PENDING`
    - `fileHash=SHA-256(fileBytes)`
    - `storageObjectKey` = MinIO object key
  - Writes an outbox message via `ReliableMessagePublisher.publish(...)`.
  - Cleanup:
    - if DB/outbox fails after upload, deletes the MinIO object via `FileService.deleteFile(...)`.

## 3. Storage: Where Data Is Written

### 3.1. MinIO (object storage)

**Write**
- `FileService.uploadFile(...)` stores the original file in bucket `${app.minio.bucket}`.
- Object key format:
  - `resume-scans/<userId>/<uuid>_<originalFilename>` or `resume-scans/guest/...`

**Read**
- `FileService.getFileStream(objectKey)` used by the worker.

### 3.2. Database tables

**resume_scans** (`ResumeScan`)
- `backend/src/main/java/com/project/AIH/models/ResumeScan.java`
- Stores:
  - File identity: `file_name`, `storage_object_key`, `content_type`, `file_size`, `file_hash`
  - Extracted content: `extracted_text`, `content_hash` (SHA-256 of extracted text bytes)
  - AI summary fields: `candidate_name`, `level`, `industry`, `total_score`, `stage2_score`, `stage3_score`, `stage4_score`, `strengths`
  - Processing: `status`, `attempt_count`, `failure_code`, `failure_message`, `scanned_at`, `completed_at`
  - User feedback: `user_rating`, `user_feedback`

**resume_scan_raw_ai_output** (`ResumeScanRawAiOutput`)
- `backend/src/main/java/com/project/AIH/models/ResumeScanRawAiOutput.java`
- Stores:
  - `ats_json`: the normalized + enriched JSON that the backend trusts (after validation)
  - `ai_model`: currently set by worker (hardcoded)
  - `prompt_version`: currently set by worker (hardcoded)

**scan_sub_scores** (`ScanSubScore`)
- `backend/src/main/java/com/project/AIH/models/ScanSubScore.java`
- One row per sub-category item (sectionKey).
- Stores:
  - `section_key`, `score`, `max_score`, `lost_points`, `details` (JSON array), `tip`

**scan_actions** (`ScanAction`)
- `backend/src/main/java/com/project/AIH/models/ScanAction.java`
- One row per recommended action.
- Stores:
  - `action`, `priority`, `sort_order`

**outbox_messages** (`OutboxMessage`)
- `backend/src/main/java/com/project/AIH/models/OutboxMessage.java`
- Stores:
  - `exchange`, `routing_key`, `payload` (JSON string), `status`, `retry_count`
  - Relay worker marks `PROCESSED` when successfully sent to Rabbit.

## 4. Messaging: Outbox -> RabbitMQ -> Worker

### 4.1. Message shape

**Payload DTO**
- `backend/src/main/java/com/project/AIH/dto/ResumeScanMessage.java`
```json
{
  "scanId": 123,
  "storageObjectKey": "resume-scans/1/<uuid>_cv.pdf",
  "contentType": "application/pdf",
  "fileHash": "<sha256>"
}
```

### 4.2. RabbitMQ routing

- Exchange: `cv.parsing.exchange`
- Routing key: `cv.parsing.routing.key`
- Queue: `cv.parsing.queue`
- Defined in `backend/src/main/java/com/project/AIH/config/RabbitMQConfig.java`

### 4.3. Relay mechanics (idempotency / multi-instance safe)

- `backend/src/main/java/com/project/AIH/services/OutboxRelayWorker.java`
  - Claims outbox row with `PENDING -> PROCESSING` (DB conditional update).
  - Sends message body as JSON bytes.
  - Marks `PROCESSED` when sent.
  - On send failure, increments retryCount and returns status to `PENDING` (until max retries, then `FAILED`).

## 5. Worker Processing: ResumeScanWorker

File: `backend/src/main/java/com/project/AIH/services/ResumeScanWorker.java`

### 5.1. Status transitions

- Initial created: `PENDING` (API thread)
- Worker claims: sets `EXTRACTING` and increments `attemptCount`
- After extraction: sets `ANALYZING`
- Final: sets `COMPLETED` or `FAILED`

Note: statuses are updated in short transactions via `ResumeScanStateService` so the UI can observe intermediate states while the worker is still running.

### 5.2. File -> text extraction

- Downloads file bytes from MinIO (`FileService.getFileStream(...)`).
- Attempts Apache Tika extraction:
  - `ResumeParserService.extractText(InputStream)`
  - If it fails, continues with an empty/short text and will prefer the vision path.

### 5.3. Choosing vision vs. text-only Gemini

Heuristic: `isTextCorrupted(extractedText)`
- If text is null or length < 300 => vision-first (`GeminiService.parseResume(bytes, contentType)`)
- Else if text has neither `@` nor a 9-11 digit number => vision-first
- Otherwise => text-only (`GeminiService.parseResumeText(extractedText)`)

This is a pragmatic heuristic, but it can mis-route in these cases:
- CV has no email/phone in extracted text (image CV, header stripped, or ATS-unsafe layout)
- International phone formats not matching `\\d{9,11}`
- Very short CV (intern) where text length < 300 but still clean

## 6. Prompt Review (Gemini)

### 6.1. Where the prompt lives

- `backend/src/main/java/com/project/AIH/services/GeminiService.java`
  - `parseResume(byte[] fileBytes, String contentType)`:
    - vision-first prompt for scoring; intended to infer formatting/layout and content from the binary file
  - `parseResumeText(String extractedText)`:
    - text-only prompt; loses visual layout and may under-detect formatting/ATS issues

### 6.2. Current prompt design: strengths

- Strict output contract:
  - Requires returning a single JSON object (no markdown/text).
- Low temperature (`0.1`) and `responseMimeType=application/json`.
- `ScoringResultValidator` recalculates/clamps all scores from the `details` lines:
  - This reduces grade inflation and normalizes inconsistent model output.

### 6.3. Current prompt design: accuracy risks / optimization opportunities

1. Prompt length is very large (especially `parseResumeText`):
   - Long instructions can reduce compliance on edge cases (model may truncate, omit fields, or drift into non-JSON).
   - Consider splitting into:
     - a short system-style instruction (rules)
     - a compact JSON schema example
     - a separate rubric block referenced by keys

2. Vision vs text-only divergence:
   - Scoring includes ATS format/layout signals. Text-only mode cannot see layout, icons, 2-column complexity, etc.
   - If the goal is "accurate ATS scan", vision-first should be favored more often.
   - Alternative approach: always run vision-first for PDF, and only use text-only for DOC/DOCX that Tika extracts cleanly.

3. Locale/encoding noise in prompt source:
   - The source file shows many mojibake sequences (likely saved in the wrong encoding at some point).
   - This can subtly degrade model understanding.
   - Recommended: normalize prompt strings to UTF-8 clean Vietnamese in the source.

4. Schema drift / parsing fragility:
   - The mapper (`ScanMapperService`) expects `details` arrays with items in fixed order per category.
   - If Gemini swaps order or changes labeling, normalization currently only clamps numbers but does not re-order or validate the array length.
   - Suggested hardening:
     - enforce exact array length per category (pad missing with defaults)
     - reject extra items beyond expected length
     - optionally introduce explicit per-item keys instead of positional mapping

5. Reproducibility / versioning:
   - Worker currently saves `ai_model` and `prompt_version` as constants.
   - Suggested:
     - move these into config
     - include a `promptHash` (SHA-256 prompt) stored in DB for forensics

## 7. JSON Validation + Enrichment

After Gemini returns `atsJson`:

1. Parse as JSON: `ObjectMapper.readTree(atsJson)`
2. Normalize + clamp scores:
   - `backend/src/main/java/com/project/AIH/services/ScoringResultValidator.java`
   - Rewrites `details` lines to normalized `+score/max` format
   - Recomputes `stage2_core.score`, `stage3_in_depth.score`, `stage4_bonus.score`, `total_score`
3. Enrich `score_gaps`:
   - `ScanMapperService.enrichAndCalculateGaps(...)`
   - Produces a `score_gaps` array (top 5) with a category-level summary + tip

Important: `resume_scan_raw_ai_output.ats_json` stores the *post-normalization* JSON, not the raw model output.

## 8. Mapping JSON -> Relational Tables

`backend/src/main/java/com/project/AIH/services/ScanMapperService.java`

- Populates scalar fields on `ResumeScan`:
  - candidate fields, scores, strengths
- Rebuilds child collections:
  - `subScores` extracted from category `details` arrays (positional mapping -> sectionKey)
  - `actions` extracted from `priority_actions`
- Persists by saving `ResumeScan` with cascades to `ScanSubScore` and `ScanAction`.

## 9. What the frontend gets

`GET /api/v1/resume-scans/{id}` returns `ResumeScanResultDTO`:
- status + file name + timestamps
- candidate name/level/industry
- stage scores + strengths
- priority actions + sub-scores
- computed `scoreGaps` (top 5)
- failureCode/failureMessage (if failed)
- `rawGeminiData` parsed from stored `ats_json` (best-effort)

File: `backend/src/main/java/com/project/AIH/dto/ResumeScanResultDTO.java`

## 10. Practical "most accurate" configuration suggestions

If the priority is maximum accuracy over speed/cost:

- Prefer vision-first for PDFs (layout matters most there).
- Increase Gemini timeout slightly for large PDFs and reduce retry concurrency to avoid 429 bursts.
- Clean up prompt encoding and shorten prompt blocks to improve strict JSON compliance.
- Strengthen JSON schema validation:
  - required fields present
  - correct array lengths
  - numeric ranges
  - strict enum values for priority

