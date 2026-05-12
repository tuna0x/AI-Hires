# 🏗️ Senior Review — Toàn Bộ Luồng Dữ Liệu Hệ Thống AI-Hires

> **Phiên bản được review:** Tài liệu mô tả kiến trúc CV Scoring + Interview (Event-Driven, RabbitMQ, Spring Boot, PostgreSQL, Gemini AI)  
> **Góc nhìn:** Senior đã vận hành hệ thống AI-assisted hiring ở production scale  
> **Verdict tổng thể:** Đây là bản thiết kế **tốt hơn đáng kể** so với phiên bản đầu. Nhiều vấn đề đã được giải quyết (idempotency key, validation layer, async scoring, question bank). Các vấn đề còn lại tập trung ở độ bền vận hành và một số edge case quan trọng.

---

## 📊 Scorecard Tổng Quan

| Hạng mục | Điểm | Nhận xét |
|---|---|---|
| Kiến trúc tổng thể | 8/10 | Event-driven đúng hướng, tách biệt concerns tốt |
| Resume Upload & Parse | 7/10 | Async tốt, còn thiếu xử lý CompletableFuture failure |
| CV Scoring Pipeline | 8/10 | RabbitMQ + Worker pattern đúng, thiếu DLQ strategy |
| Interview Flow | 7.5/10 | Idempotency tốt, Running Summary là ý tưởng hay |
| Report Generation | 6/10 | Polling loop 50s là điểm yếu nhất của toàn hệ thống |
| Database Schema | 7.5/10 | Cấu trúc sạch, còn thiếu index và một số constraint |
| API Design | 8/10 | RESTful nhất quán, response code hợp lý |
| Khả năng vận hành (Ops) | 5/10 | Thiếu DLQ, observability, retry strategy rõ ràng |

---

## I. PHÂN HỆ RESUME — Những Gì Đã Tốt ✅

Trước khi đi vào vấn đề, ghi nhận những cải tiến thực chất so với phiên bản trước:

- **`202 Accepted` + async CompletableFuture**: Đúng — không block HTTP thread cho tác vụ 11–25 giây.
- **SHA-256 hash theo `userId + contentHash`**: Đã fix đúng vấn đề cross-user cache hit từ review trước.
- **`ResumeRawAiOutput` tách riêng**: Tốt — raw JSON không còn nằm trong bảng `Resume` chính.
- **Apache Tika kiểm tra MIME type**: Đúng cách — không tin vào file extension, kiểm tra magic bytes.
- **`scoringResultValidator.validateAndNormalize()`**: Đã có validation layer, tự tính lại điểm — đúng hướng.
- **`ScoringResultValidator` bóc tách chuỗi `x/y`**: Cẩn thận hơn so với parse trực tiếp.

---

## II. CÁC VẤN ĐỀ CÒN TỒN TẠI

---

### 🔴 Vấn đề 1 — CompletableFuture.runAsync không có error boundary: lỗi âm thầm mất hoàn toàn

**Vị trí:** Luồng 1.1 — Upload & Parse CV (nhánh async)

**Vấn đề:**

```java
// Hiện tại — không có xử lý lỗi
CompletableFuture.runAsync(() -> {
    callGeminiAndSave(resumeId);  // Nếu throw exception → mất hoàn toàn
});
```

Khi `CompletableFuture.runAsync` được dùng mà không có `.exceptionally()` hoặc `.handle()`:
- Exception bị **nuốt im lặng** — không log, không retry, không alert
- Resume tồn tại với `parseStatus = PROCESSING` mãi mãi
- User thấy spinner không bao giờ dừng, không biết phải làm gì
- Không có cách nào biết lỗi xảy ra ở đâu nếu không có monitoring

**Fix bắt buộc:**

```java
CompletableFuture.runAsync(() -> {
    parseAndSaveResume(resumeId, extractedText);
}, executor)
.exceptionally(ex -> {
    log.error("[ResumeParser] resumeId={} failed: {}", resumeId, ex.getMessage(), ex);
    // Cập nhật trạng thái để user biết
    resumeRepo.updateStatus(resumeId, ParseStatus.FAILED, ex.getMessage());
    // Gửi retry job hoặc alert
    retryQueue.push(new RetryParseJob(resumeId, RetryReason.ASYNC_FAILURE));
    return null;
});
```

**Thêm vào DB để theo dõi:**
```sql
ALTER TABLE resume
  ADD COLUMN failure_reason  TEXT,
  ADD COLUMN retry_count     INT DEFAULT 0,
  ADD COLUMN last_retried_at TIMESTAMPTZ;
```

---

### 🔴 Vấn đề 2 — Report Generation Worker: polling loop 50 giây là anti-pattern nghiêm trọng

**Vị trí:** Luồng 2.3 — Finish & Report Generation

**Luồng hiện tại:**
```
ReportGenerationWorker nhận message
→ Loop tối đa 25 lần × sleep 2 giây = 50 giây
→ Poll DB kiểm tra "đã chấm điểm đủ 5 câu chưa?"
→ Khi đủ → generate report
```

**Tại sao đây là vấn đề nghiêm trọng:**

```
1. Thread của Worker bị BLOCK 50 giây (worst case)
   → Nếu có 100 users kết thúc phiên cùng lúc = 100 threads blocked 50s
   → Worker pool kiệt sức, queue tắc nghẽn

2. Poll DB mỗi 2 giây × 25 lần = 25 SELECT queries chỉ để chờ
   → Tải không cần thiết lên DB

3. Race condition: Nếu sau 50s vẫn còn 1 câu pending
   → Report generate thiếu dữ liệu HOẶC worker skip → không có báo cáo

4. Retry nguy hiểm: Nếu message bị retry (RabbitMQ requeue)
   → Worker chạy lại, bắt đầu vòng lặp 50s nữa → duplicate report
```

**Root cause:** Vấn đề xảy ra vì `InterviewScoringWorker` (chấm điểm) và `ReportGenerationWorker` (tạo báo cáo) không có coordination mechanism, nên ReportWorker phải chủ động poll để biết ScoringWorker đã xong chưa.

**Giải pháp đúng — Event-driven coordination:**

```
Thay vì ReportWorker poll DB,
hãy để ScoringWorker tự kích hoạt report khi câu cuối được chấm xong.
```

```java
// Trong InterviewScoringWorker, sau khi lưu điểm:
@RabbitListener(queues = "INTERVIEW_SCORING_QUEUE")
public void handleScoring(InterviewScoringMessage msg) {
    // ... chấm điểm, lưu DB ...
    evaluationRepo.save(evaluation);

    // Kiểm tra có phải câu cuối không
    int pending = answerRepo.countPendingBySession(msg.getSessionId());
    int answered = answerRepo.countAnsweredBySession(msg.getSessionId());

    if (pending == 0 && answered >= REQUIRED_QUESTIONS) {
        // TẤT CẢ CÂU ĐÃ CHẤM XONG → Kích hoạt report NGAY
        // Không cần polling, không cần sleep
        rabbitTemplate.convertAndSend(
            "REPORT_GENERATION_EXCHANGE",
            "REPORT_READY_KEY",
            new ReportReadyMessage(msg.getSessionId())
        );
        log.info("[Scoring] All answers scored for session={}, report triggered", msg.getSessionId());
    }
}
```

```java
// ReportGenerationWorker — không còn polling loop
@RabbitListener(queues = "REPORT_READY_QUEUE")
public void handleReportReady(ReportReadyMessage msg) {
    // Tất cả điểm đã sẵn sàng khi message này đến
    // Lấy dữ liệu và generate report ngay
    generateAndSaveReport(msg.getSessionId());
}
```

**So sánh:**

| | Polling loop hiện tại | Event-driven đề xuất |
|---|---|---|
| Thread bị block | 0–50 giây | < 1 giây |
| DB queries để chờ | 0–25 queries | 0 queries |
| Risk duplicate report | Cao (khi retry) | Thấp (idempotent check) |
| Scalability | Kém | Tốt |

---

### 🔴 Vấn đề 3 — Không có Dead Letter Queue (DLQ): message lỗi mất vĩnh viễn

**Vị trí:** Tất cả các queue — `CV_SCORING_QUEUE`, `INTERVIEW_SCORING_QUEUE`, `REPORT_GENERATION_QUEUE`

**Vấn đề:**

Khi một message bị xử lý fail (Gemini timeout, DB unreachable, parse error):
- Không có DLQ → RabbitMQ sẽ **drop message** (nếu auto-ack) hoặc **requeue vô hạn** (nếu nack)
- Drop: Ứng viên mất điểm, mất báo cáo, không biết tại sao
- Requeue vô hạn: Một message lỗi cứ được retry mãi mãi → worker bị spam → queue tắc nghẽn → ảnh hưởng tất cả users khác

**Cấu hình DLQ đúng cách (RabbitMQ):**

```java
// Config Bean
@Bean
public Queue cvScoringQueue() {
    return QueueBuilder.durable("CV_SCORING_QUEUE")
        .withArgument("x-dead-letter-exchange", "DLX_EXCHANGE")
        .withArgument("x-dead-letter-routing-key", "cv.scoring.dead")
        .withArgument("x-message-ttl", 300_000)  // 5 phút TTL
        .build();
}

@Bean
public Queue cvScoringDeadLetterQueue() {
    return QueueBuilder.durable("CV_SCORING_DLQ").build();
}

@Bean
public DirectExchange deadLetterExchange() {
    return new DirectExchange("DLX_EXCHANGE");
}

@Bean
public Binding cvScoringDlqBinding() {
    return BindingBuilder
        .bind(cvScoringDeadLetterQueue())
        .to(deadLetterExchange())
        .with("cv.scoring.dead");
}
```

```java
// Trong Worker — retry có giới hạn rồi mới nack
@RabbitListener(queues = "CV_SCORING_QUEUE")
public void handleCvScoring(CvScoringMessage msg,
                             @Header(AmqpHeaders.DELIVERY_TAG) long tag,
                             Channel channel) throws IOException {
    int retryCount = getRetryCount(msg);

    try {
        processCvScoring(msg);
        channel.basicAck(tag, false);

    } catch (GeminiTimeoutException e) {
        if (retryCount < MAX_RETRIES) {  // MAX_RETRIES = 3
            Thread.sleep(exponentialBackoff(retryCount));
            channel.basicNack(tag, false, true);  // requeue
        } else {
            log.error("Max retries exceeded for applicationId={}", msg.getApplicationId());
            alertOpsTeam(msg, e);
            channel.basicNack(tag, false, false);  // → DLQ
        }
    } catch (Exception e) {
        // Lỗi không thể retry (parse error, validation fail)
        log.error("Non-retryable error for applicationId={}", msg.getApplicationId(), e);
        channel.basicNack(tag, false, false);  // → DLQ ngay
    }
}
```

**DLQ Monitor job (chạy mỗi 5 phút):**
```java
// Đọc DLQ, gửi alert, lưu vào bảng failed_jobs để ops xử lý thủ công
@Scheduled(fixedDelay = 300_000)
public void monitorDeadLetterQueue() {
    List<FailedMessage> deadMessages = dlqReader.drain("CV_SCORING_DLQ");
    if (!deadMessages.isEmpty()) {
        alertService.sendSlackAlert(
            String.format("⚠️ %d messages in CV_SCORING_DLQ — manual intervention needed",
                deadMessages.size())
        );
        failedJobRepo.saveAll(deadMessages);
    }
}
```

---

### 🟡 Vấn đề 4 — `updateRunningSummary` gọi Gemini thêm 1 lần per answer: chi phí ẩn

**Vị trí:** Luồng 2.2 — Submit Answer, trong `InterviewScoringWorker`

**Hiện tại per mỗi câu trả lời:**
```
1. evaluateAnswerOnly()      → Gemini call #1 (chấm điểm)
2. updateRunningSummary()    → Gemini call #2 (cập nhật tóm tắt)
```

Với 5 câu hỏi → **10 Gemini calls per phiên** chỉ cho scoring + summary. Nhân với số phiên = chi phí API tăng gấp đôi.

**Vấn đề thứ hai:** `updateRunningSummary` gửi toàn bộ `oldSummary + câu hỏi + câu trả lời` mới vào prompt. Khi đến câu 4–5, prompt này ngày càng dài → token tăng → latency tăng → chi phí tăng lũy tiến.

**Hướng cải thiện — Merge 2 calls thành 1:**

```python
# Thay vì 2 calls riêng biệt, merge vào 1 prompt duy nhất:
prompt = """
Đánh giá câu trả lời sau VÀ cập nhật tóm tắt phỏng vấn.

Câu hỏi: {question}
Câu trả lời: {answer}
Tóm tắt hiện tại: {current_summary}

Trả về JSON với 2 phần:
{
  "evaluation": {
    "score": integer (0-100),
    "feedback": string,
    "strengths": [string],
    "improvements": [string]
  },
  "updated_summary": string  // Tóm tắt ngắn gọn tối đa 200 từ
}
"""
```

Giảm từ 10 → 5 Gemini calls per phiên. Chi phí giảm 50%.

**Thêm:** Cap độ dài của `runningSummary` trong prompt:

```java
// Truncate summary nếu quá dài để tránh token explosion
String truncatedSummary = runningSummary.length() > 500
    ? runningSummary.substring(runningSummary.length() - 500)
    : runningSummary;
```

---

### 🟡 Vấn đề 5 — `GET /interviews/{sessionId}/questions` trả về gì? Có lộ câu hỏi tương lai không?

**Vị trí:** API endpoint `GET /api/v1/interviews/{sessionId}/questions`

**Mô tả:** *"Lấy danh sách các câu hỏi hiển thị (các câu hỏi ứng viên đã hoặc đang trả lời)"*

**Rủi ro:** Nếu endpoint này trả về **tất cả 5 câu hỏi** trong session (vì chúng đã được pre-generate và lưu vào DB), client có thể xem trước câu hỏi 3, 4, 5 trước khi trả lời câu 1.

**Kiểm tra lại logic filter:**

```java
// ĐẢM BẢO chỉ trả về câu hỏi đã/đang trả lời
public List<InterviewQuestion> getVisibleQuestions(Long sessionId) {
    InterviewSession session = sessionRepo.findById(sessionId).orElseThrow();

    return questionRepo.findBySessionId(sessionId)
        .stream()
        .filter(q -> q.getOrderIndex() <= session.getCurrentQuestionIndex())
        // KHÔNG trả về câu hỏi chưa đến lượt
        .collect(Collectors.toList());
}
```

**Kiểm tra thêm ở tầng DTO:** Đảm bảo response DTO không vô tình serialize `content` của câu hỏi tương lai dù entity có đầy đủ.

---

### 🟡 Vấn đề 6 — `InterviewSession` là `OneToOne` với `Application`: Mock Interview bị ràng buộc sai

**Vị trí:** Bảng `InterviewSession` — "OneToOne với Application"

**Vấn đề:**

Mock Interview không có Application thật. Tài liệu nói:
> *"MockInit → Tạo bản ghi Job ảo & Application ảo"*

Thiết kế này tạo ra dữ liệu "ảo" trong bảng `Application` chỉ để thỏa mãn foreign key constraint của `InterviewSession`. Từ review trước, đây là overhead không cần thiết dẫn đến:
- Analytics sai: "Số đơn ứng tuyển" bị inflate bởi các Application ảo
- Query phức tạp hơn: Phải JOIN qua Application để lấy JD context của Mock
- Schema pollution: Khó phân biệt Application thật và Application ảo

**Hướng cải thiện — Nullable foreign key + discriminator:**

```sql
ALTER TABLE interview_session
  ALTER COLUMN application_id DROP NOT NULL,  -- Nullable cho Mock
  ADD COLUMN session_type    VARCHAR(10) NOT NULL DEFAULT 'REAL',
    -- ENUM: 'REAL' | 'MOCK'
  ADD COLUMN mock_job_title   VARCHAR(255),    -- Dùng khi session_type = 'MOCK'
  ADD COLUMN mock_jd_content  TEXT,            -- JD tùy chọn của Mock
  ADD COLUMN mock_resume_id   BIGINT REFERENCES resume(id);  -- CV dùng cho Mock

-- Constraint: REAL phải có application_id, MOCK không được có
ALTER TABLE interview_session ADD CONSTRAINT chk_session_type
  CHECK (
    (session_type = 'REAL' AND application_id IS NOT NULL) OR
    (session_type = 'MOCK' AND application_id IS NULL)
  );
```

---

### 🟡 Vấn đề 7 — `GET /interviews/{sessionId}/report` trả về 404 khi đang generate: client không biết chờ hay lỗi

**Vị trí:** API `GET /api/v1/interviews/{sessionId}/report`

**Hành vi hiện tại:**
```
Report chưa generate xong → 404 Not Found
Report lỗi, không bao giờ được tạo → 404 Not Found
```

Client không thể phân biệt "đang xử lý" với "thất bại" — cả hai đều nhận `404`. Frontend phải poll mù, không biết bao giờ dừng.

**Hướng cải thiện — Status endpoint rõ ràng:**

```java
// Thêm trạng thái vào InterviewSession
public enum ReportStatus {
    NOT_STARTED,    // Chưa kích hoạt tạo báo cáo
    GENERATING,     // Đang xử lý
    COMPLETED,      // Xong, có thể lấy
    FAILED          // Lỗi, cần thông báo user
}

// Response khi report chưa xong — KHÔNG dùng 404
GET /interviews/{sessionId}/report

→ 200 OK:
{
  "reportStatus": "GENERATING",
  "estimatedSeconds": 15,
  "report": null
}

→ 200 OK (khi xong):
{
  "reportStatus": "COMPLETED",
  "report": { ... full report ... }
}

→ 200 OK (khi lỗi):
{
  "reportStatus": "FAILED",
  "errorMessage": "Không thể tạo báo cáo. Vui lòng thử lại.",
  "report": null
}
```

---

### 🟡 Vấn đề 8 — `useCount` trong `InterviewQuestionBank` tăng nhưng không có cơ chế rotate

**Vị trí:** Luồng 2.1 — Start Session, bước `Select3 → Tăng useCount`

**Vấn đề:** `useCount` được tăng để ưu tiên câu ít dùng hơn. Nhưng:
- Không có cơ chế **archive câu hỏi đã dùng quá nhiều** (ví dụ >50 lần)
- Không có cơ chế **decay**: câu hỏi dùng 100 lần cách đây 1 năm vs câu mới thêm 1 tuần trước — useCount cũ vẫn cao hơn
- Khi pool nhỏ (< 10 câu), cùng 3 câu sẽ lặp lại với user dùng nhiều lần

**Hướng cải thiện:**

```sql
ALTER TABLE interview_question_bank
  ADD COLUMN is_retired    BOOLEAN DEFAULT FALSE,   -- Retire khi useCount quá cao
  ADD COLUMN last_used_at  TIMESTAMPTZ,
  ADD COLUMN quality_score DECIMAL(3,1) DEFAULT 5.0; -- 0-10, dựa trên user feedback

-- Query sampling có trọng số thông minh hơn
SELECT * FROM interview_question_bank
WHERE job_id = ? AND difficulty_level = ?
  AND is_retired = FALSE
  AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '7 days')
ORDER BY (use_count * 0.3 + (10 - quality_score) * 0.7) ASC  -- Ít dùng + chất lượng cao
LIMIT 10;

-- Cronjob retire câu hỏi dùng quá nhiều
UPDATE interview_question_bank
SET is_retired = TRUE
WHERE use_count > 100 AND quality_score < 6.0;
```

---

### 🟡 Vấn đề 9 — `ResumeScan` và `CvScore` song song tồn tại: hai luồng scoring gây nhầm lẫn

**Vị trí:** Bảng dữ liệu — `ResumeScan` vs `CvScore`

**Quan sát:**
- `ResumeScan`: *"Lưu kết quả quét CV nhanh dành cho Khách vãng lai"*
- `CvScore`: *"Điểm số đánh giá chi tiết đa tầng giữa CV và JD"* — gắn với `Application`

**Câu hỏi cần làm rõ:** Khi user đăng nhập và upload CV (không apply job) — kết quả lưu vào `ResumeScan` hay `CvScore`? Tài liệu không nói rõ.

**Rủi ro:**
- Cùng một CV, cùng một user nhưng điểm có thể nằm ở 2 bảng khác nhau tùy vào flow đi qua
- Frontend query điểm lịch sử → phải JOIN 2 bảng và merge → phức tạp
- Báo cáo analytics khó tổng hợp

**Đề xuất làm rõ trong code:**

```
Quy ước rõ ràng:
- ResumeScan: Quick scan (không có JD), dùng cho feature "CV Checker" standalone
- CvScore: Deep scan với JD context, chỉ tạo khi có Application

Nếu user đăng nhập scan CV không có JD → ResumeScan
Nếu user apply job → Application → CvScore
KHÔNG bao giờ dùng lẫn lộn.
```

Ghi rõ vào comment trong Entity và Service để tránh nhầm lẫn sau này.

---

### 🟣 Vấn đề 10 — Thiếu Outbox Pattern: có thể mất message giữa DB write và RabbitMQ publish

**Vị trí:** Luồng 1.2 Apply & Score — bước "BE → MQ: Gửi CvScoringMessage"

**Vấn đề kinh điển của distributed system:**

```java
// Đây là 2 operations độc lập — KHÔNG atomic
applicationRepo.save(application);   // Operation 1: DB write
rabbitTemplate.convertAndSend(msg);   // Operation 2: MQ publish

// Nếu server crash giữa 2 dòng:
// → Application = SAVED (status: AI_SCREENING)
// → Message = NEVER SENT
// → Worker không bao giờ nhận message
// → Application stuck ở AI_SCREENING mãi mãi
// → User không có điểm, không biết tại sao
```

**Hướng fix — Transactional Outbox Pattern:**

```sql
-- Bảng outbox: message được lưu CÙNG transaction với DB write
CREATE TABLE outbox_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id BIGINT NOT NULL,        -- applicationId hoặc sessionId
  event_type   VARCHAR(100) NOT NULL,  -- 'CV_SCORING' | 'INTERVIEW_SCORING' | 'REPORT_GENERATION'
  payload      JSONB NOT NULL,
  status       VARCHAR(20) DEFAULT 'PENDING',  -- PENDING | SENT | FAILED
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  sent_at      TIMESTAMPTZ
);
```

```java
@Transactional
public Application applyForJob(ApplyRequest request) {
    Application application = applicationRepo.save(buildApplication(request));

    // Lưu message vào CÙNG transaction — nếu DB rollback, message cũng rollback
    outboxRepo.save(OutboxMessage.builder()
        .aggregateId(application.getId())
        .eventType("CV_SCORING")
        .payload(toJson(new CvScoringMessage(application)))
        .build());

    return application;
    // Commit một lần duy nhất: cả Application và OutboxMessage
    // Không bao giờ mất message dù server crash
}

// Relay job đọc outbox và publish sang RabbitMQ (chạy mỗi 5 giây)
@Scheduled(fixedDelay = 5000)
public void relayOutboxMessages() {
    List<OutboxMessage> pending = outboxRepo.findPending(100);
    for (OutboxMessage msg : pending) {
        try {
            rabbitTemplate.convertAndSend(msg.getEventType(), msg.getPayload());
            outboxRepo.markSent(msg.getId());
        } catch (Exception e) {
            outboxRepo.markFailed(msg.getId(), e.getMessage());
        }
    }
}
```

---

### 🟣 Vấn đề 11 — Thiếu Circuit Breaker cho Gemini: một Gemini incident = toàn hệ thống tê liệt

**Vị trí:** Tất cả các điểm gọi Gemini

**Vấn đề:**

Hệ thống có ít nhất 6 điểm gọi Gemini:
1. Parse ATS (Upload flow)
2. Parse Profile (Upload flow)
3. Score CV with JD (Worker)
4. Generate Interview Questions (Start Session)
5. Evaluate Answer (Scoring Worker)
6. Generate Final Report (Report Worker)

Nếu Gemini có incident (timeout, rate limit, outage) → tất cả 6 điểm fail → toàn bộ hệ thống không dùng được.

**Cấu hình Circuit Breaker (Resilience4j):**

```java
@Bean
public CircuitBreakerConfig geminiCircuitBreakerConfig() {
    return CircuitBreakerConfig.custom()
        .failureRateThreshold(50)           // Mở circuit khi 50% calls fail
        .waitDurationInOpenState(Duration.ofSeconds(30))  // Thử lại sau 30s
        .slidingWindowSize(10)              // Đánh giá trên 10 calls gần nhất
        .permittedNumberOfCallsInHalfOpenState(3)
        .build();
}

@CircuitBreaker(name = "gemini", fallbackMethod = "fallbackGenerate")
public String callGemini(String prompt) {
    return geminiClient.generate(prompt);
}

public String fallbackGenerate(String prompt, Exception ex) {
    log.warn("Gemini circuit open, using fallback: {}", ex.getMessage());
    return getFallbackResponse(prompt);  // Template response
}
```

---

## III. ĐÁNH GIÁ API DESIGN

API design nhìn chung RESTful và nhất quán. Một vài điểm nhỏ cần xem xét:

| Endpoint | Vấn đề | Đề xuất |
|---|---|---|
| `POST /interviews/{sessionId}/finish` | Idempotency? Bấm 2 lần → 2 report? | Thêm idempotency check: nếu session đã COMPLETED thì trả về ngay |
| `GET /interviews/{sessionId}/report` | 404 khi chưa có report — không distinguish PENDING vs FAILED | Trả 200 + `{ reportStatus: "GENERATING" }` thay vì 404 |
| `POST /resumes/upload` trả 201 vs 202 | 201 (cache hit) vs 202 (đang xử lý) — tốt | Thêm `Location` header trỏ đến `GET /resumes/{id}` để client poll |
| `GET /interviews/{sessionId}/scores` | Thiếu WebSocket/SSE — client phải poll | Xem xét SSE endpoint `GET /interviews/{sessionId}/scores/stream` |

---

## IV. DATABASE — Các Index Còn Thiếu

Dựa trên query pattern thực tế:

```sql
-- 1. Lấy session history của user
CREATE INDEX idx_interview_session_user
  ON interview_session(user_id, created_at DESC)
  WHERE session_type = 'MOCK';  -- Partial index cho mock sessions

-- 2. Check pending answers trong Report Worker
CREATE INDEX idx_interview_answer_session_status
  ON interview_answer(session_id, score_status);

-- 3. Lấy questions của session theo thứ tự
CREATE INDEX idx_interview_question_session_order
  ON interview_question(session_id, order_index);

-- 4. Question bank lookup
CREATE INDEX idx_question_bank_lookup
  ON interview_question_bank(job_id, difficulty_level, is_retired, use_count);

-- 5. Outbox relay query
CREATE INDEX idx_outbox_pending
  ON outbox_messages(status, created_at)
  WHERE status = 'PENDING';
```

---

## V. Lộ Trình Xử Lý Theo Mức Độ Ưu Tiên

### 🚨 Phải fix trước khi production (Sprint hiện tại)

| # | Vấn đề | Effort | Impact |
|---|---|---|---|
| 1 | CompletableFuture không có error boundary | 2h | Tránh silent failure, resume stuck PROCESSING |
| 2 | Report Worker polling loop → Event-driven | 1 ngày | Scalability, tránh thread exhaustion |
| 3 | DLQ cho tất cả queues | 4h | Tránh mất message, ops visibility |
| 7 | Report API trả 404 → trả 200 + status | 2h | UX — client biết phân biệt pending vs error |

### ⚠️ Fix trong Sprint tiếp theo

| # | Vấn đề | Effort | Impact |
|---|---|---|---|
| 4 | Merge 2 Gemini calls → 1 (scoring + summary) | 4h | Giảm 50% Gemini API cost |
| 5 | Kiểm tra question visibility leak | 2h | Tính toàn vẹn của phiên thi |
| 6 | InterviewSession Mock không cần Application ảo | 3h | Data integrity, analytics sạch |
| 9 | Làm rõ ranh giới ResumeScan vs CvScore | 2h | Tránh nhầm lẫn trong team |

### 💡 Cải thiện dài hạn

| # | Vấn đề | Effort | Impact |
|---|---|---|---|
| 8 | Question bank rotation + quality score | 3 ngày | Chất lượng câu hỏi theo thời gian |
| 10 | Outbox Pattern | 2 ngày | Đảm bảo at-least-once delivery |
| 11 | Circuit Breaker toàn bộ Gemini calls | 1 ngày | Resilience khi Gemini incident |

---

## VI. Nhận Xét Cuối

> Đây là bản thiết kế **có chiều sâu thực sự** — không phải CRUD app mà là một hệ thống distributed có tư duy về async processing, idempotency, hybrid question generation, running summary. Những thứ này thường chỉ xuất hiện ở team đã có kinh nghiệm production.
>
> **Điểm yếu cốt lõi còn lại** tập trung ở **operational resilience**: DLQ, circuit breaker, error boundary cho async task, và polling loop trong Report Worker. Đây là những thứ không ảnh hưởng đến demo nhưng sẽ **lộ ra ngay khi có tải thật hoặc Gemini có vấn đề**.
>
> Fix **Vấn đề 1** (CompletableFuture error boundary) và **Vấn đề 2** (polling loop → event-driven) là 2 việc có tỷ lệ effort/impact tốt nhất — cả hai đều có thể làm trong 1–2 ngày và ngăn được những sự cố nghiêm trọng nhất trong production.
