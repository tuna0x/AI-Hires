---
name: debug-cv-scan
description: >
  Use this skill when debugging any failure in the CV scanning and AI parsing pipeline
  in Intervio. Triggers include CV upload errors, ResumeScan stuck in PENDING,
  EXTRACTING, ANALYZING, or FAILED status, outbox messages not relayed, RabbitMQ
  messages not consumed, Apache Tika text extraction returning blank or garbled
  content, Gemini 429 rate limit errors, invalid JSON returned from Gemini,
  ScoringResultValidator exceptions, or ResumeScan database mapping violations.
---

# Skill: Troubleshooting the CV Scanning Pipeline

Use this for the async CV scan flow from upload through MinIO, outbox, RabbitMQ,
Tika extraction, Gemini parsing, validation, and DB persistence.

## Pipeline Overview

```text
Client upload
  -> ResumeScanController
  -> ResumeScanService
  -> MinIO upload
  -> resume_scans row status=PENDING
  -> outbox_messages row status=PENDING
  -> OutboxRelayWorker
  -> RabbitMQ cv.parsing.queue
  -> ResumeScanWorker
  -> Tika text extraction
  -> Gemini text-first or vision fallback
  -> ScoringResultValidator
  -> ScanMapperService
  -> resume_scans status=COMPLETED or FAILED
```

## Stage 1: Upload and Scan Row

Symptoms: upload fails immediately or no `resume_scans` row is created.

Diagnostic steps:

1. Check `ResumeScanService.validateFile()` constraints. Current max upload size is 10MB.
2. Confirm MIME detection accepts only PDF, DOC, or DOCX.
3. Verify MinIO upload succeeds and the object exists under `resume-scans/<userId>/`
   or `resume-scans/guest/`.
4. Query recent scan rows:

```sql
SELECT id, status, failure_code, file_name, storage_object_key, created_at
FROM resume_scans
ORDER BY created_at DESC
LIMIT 10;
```

## Stage 2: Outbox and RabbitMQ Relay

Symptoms: upload succeeds and scan remains `PENDING`; worker never starts.

The current `outbox_messages` table stores the scan message only in JSON `payload`.
There is no separate aggregate id column.

Diagnostic steps:

1. Inspect pending/failed outbox rows:

```sql
SELECT id, status, retry_count, payload, created_at, processed_at
FROM outbox_messages
WHERE status IN ('PENDING', 'FAILED', 'PROCESSING')
ORDER BY created_at DESC
LIMIT 20;
```

2. Find the scan id inside `payload`, for example `"scanId":123`.
3. If status is `PENDING`, check whether `OutboxRelayWorker` is running.
4. If status is `FAILED`, RabbitMQ relay likely failed more than 5 times.
5. Check RabbitMQ UI:
   - Exchange: `cv.parsing.exchange`
   - Queue: `cv.parsing.queue`
   - Routing key: `cv.parsing.routing.key`
   - DLQ: `cv.dlq`

## Stage 3: Worker Claim and Retry Behavior

Symptoms: scan is stuck in `EXTRACTING`, `ANALYZING`, repeatedly fails, or is unexpectedly
processed again.

Expected behavior:

- `ResumeScanWorker` claims only `PENDING` scans.
- Claim moves status to `EXTRACTING` and increments `attempt_count`.
- Retryable failures reset the scan to `PENDING` until `attempt_count` reaches 3.
- Exhausted retryable failures and non-retryable failures mark status `FAILED` and do not
  requeue the RabbitMQ message.
- Existing `FAILED`, `COMPLETED`, `EXTRACTING`, or `ANALYZING` scans are not claimed again by
  duplicate messages.

Useful query:

```sql
SELECT id, status, attempt_count, failure_code, failure_message, updated_at
FROM resume_scans
WHERE id = <scanId>;
```

## Stage 4: Text Extraction and Gemini Route

Symptoms: blank extraction, garbled text, unexpected vision usage, Gemini 400/429, or slow scans.

Current route:

- If Tika extraction succeeds and text looks clean, call `GeminiService.parseResumeText()`.
- If extraction fails, text is blank, text is too short, or text looks corrupted, use
  `GeminiService.parseResume()` vision-first.
- If vision-first returns Gemini 400 and extracted text is usable, fallback to text-only.

Text is treated as corrupted when it is very short, has too many replacement/control
characters, or has too few letters compared with total characters.

## Stage 5: JSON Validation and Mapping

Symptoms: Gemini returns a response but scan fails during validation or DB save.

Diagnostic steps:

1. Check `GeminiService` output shape. It must be one JSON object, not markdown.
2. Check `ScoringResultValidator.validateAndNormalize()` logs for missing or malformed
   stage/category details.
3. Check `ScanMapperService.populateScanResult()` logs for mapping failures.
4. Verify child rows:

```sql
SELECT rs.id, rs.status, rs.total_score, COUNT(sss.id) AS sub_score_count
FROM resume_scans rs
LEFT JOIN scan_sub_scores sss ON sss.scan_id = rs.id
WHERE rs.id = <scanId>
GROUP BY rs.id;
```

## Full Checklist

- [ ] `resume_scans.status` and `attempt_count` match expected retry state.
- [ ] MinIO object exists and is non-empty.
- [ ] `outbox_messages.payload` contains the target `scanId`.
- [ ] Outbox row is `PROCESSED` or being retried as expected.
- [ ] RabbitMQ `cv.parsing.queue` has a consumer and no unexpected DLQ growth.
- [ ] Worker logs show extraction route: text-only or vision-first fallback.
- [ ] Gemini response is valid JSON and matches the expected scoring schema.
- [ ] `ScoringResultValidator` and `ScanMapperService` complete without exceptions.

## Related Skills

- Gemini-specific debugging: `.agent/skills/debug-gemini/SKILL.md`
- Adding endpoints/features: `.agent/skills/add-feature-endpoint/SKILL.md`
