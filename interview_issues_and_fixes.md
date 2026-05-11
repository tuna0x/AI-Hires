# 🔍 Báo Cáo Lỗi Tồn Đọng & Hướng Cải Thiện — ScanCV Mock Interview

> **Phạm vi:** Phân tích luồng hiện tại (4 giai đoạn) sau khi đã áp dụng kiến trúc pre-generate + async scoring.  
> **Mức độ:** 🔴 Nghiêm trọng · 🟡 Cần cải thiện · 🟣 Đề xuất nâng cao

---

## Tổng Quan Vấn Đề

| # | Giai đoạn | Vấn đề | Mức độ |
|---|---|---|---|
| 1 | Khởi tạo | Job ảo + Application là overhead dư thừa | 🟡 |
| 2 | Tạo câu hỏi | Cache miss không có fallback → phiên thất bại | 🔴 |
| 3 | Tạo câu hỏi | Cache key quá hẹp → câu hỏi lặp lại giữa users | 🔴 |
| 4 | Tạo câu hỏi | Trả về 5 câu cùng lúc → client biết trước toàn bộ | 🟡 |
| 5 | Tạo câu hỏi | Không có timeout / circuit breaker cho Gemini | 🔴 |
| 6 | Phỏng vấn | Dùng polling thay vì push để nhận điểm | 🟡 |
| 7 | Phỏng vấn | Không có cơ chế resume nếu mất kết nối | 🟡 |
| 8 | Tổng kết | Final report gọi Gemini đồng bộ → bottleneck lớn nhất | 🔴 |
| 9 | Toàn phiên | Không có idempotency cho submit answer | 🟡 |
| 10 | Toàn phiên | Thiếu observability — không biết lỗi xảy ra ở đâu | 🟣 |

---

## Chi Tiết Từng Vấn Đề

---

### 🟡 Vấn đề 1 — Job ảo + Application là overhead dư thừa

**Giai đoạn:** Khởi tạo phiên

**Mô tả hiện tại:**
```
startMockSession → Tạo Job ảo → Tạo Application (liên kết CV + JD) → ...
```
Hệ thống tạo ra các entity `Job` và `Application` chỉ để kết nối CV với JD trong một phiên mock. Đây là abstraction mượn từ luồng apply thật sự, không phù hợp với use case phỏng vấn thử.

**Hệ quả:**
- Thêm 2 lần DB write không có business value
- Schema bị ô nhiễm bởi "Job ảo" — gây nhầm lẫn khi query analytics sau này
- Tăng coupling không cần thiết giữa module Interview và module Job/Application

**Hướng cải thiện:**

Thay bằng một entity `InterviewSession` tự chứa đủ thông tin:

```sql
CREATE TABLE interview_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  cv_snapshot   JSONB,          -- snapshot CV tại thời điểm phỏng vấn
  jd_content    TEXT,           -- nội dung JD (không cần FK sang Job)
  job_title     VARCHAR(255),
  level         VARCHAR(50),
  status        VARCHAR(20) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);
```

API đơn giản hóa:
```
POST /interviews/start
Body: { cvId, jdContent, jobTitle, level }
→ Tạo 1 InterviewSession duy nhất, không cần Job/Application
```

---

### 🔴 Vấn đề 2 — Cache miss không có fallback → phiên thất bại ngay từ đầu

**Giai đoạn:** Tạo câu hỏi Hybrid

**Mô tả hiện tại:**
```
Cache MISS → Gọi Gemini tạo toàn bộ 5 câu → Nếu Gemini fail → ???
```
Không có xử lý rõ ràng khi Gemini timeout, trả về JSON sai cấu trúc, hoặc rate limit. Toàn bộ phiên sẽ thất bại ngay tại bước khởi tạo — thời điểm tệ nhất vì user chưa làm được gì.

**Hệ quả:**
- Phiên không bao giờ bắt đầu được nếu Gemini có vấn đề
- Không có retry logic → lỗi nhất thời trở thành lỗi vĩnh viễn với user
- Không có fallback → không thể degrade gracefully

**Hướng cải thiện:**

**Bước 1 — Retry với exponential backoff:**
```python
async def generate_questions_with_retry(session_data, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await gemini.generate(prompt, timeout=8.0)
            questions = parse_and_validate(result)
            if questions:
                return questions
        except (TimeoutError, GeminiRateLimitError) as e:
            if attempt == max_retries - 1:
                break
            await asyncio.sleep(2 ** attempt)  # 1s, 2s, 4s

    # Fallback: dùng template bank
    return get_template_questions(session_data.job_title, session_data.level)
```

**Bước 2 — Template question bank làm safety net:**
```sql
CREATE TABLE question_templates (
  id          UUID PRIMARY KEY,
  job_family  VARCHAR(100),   -- 'backend', 'frontend', 'data', ...
  level       VARCHAR(50),
  category    VARCHAR(50),    -- 'technical', 'behavioral', 'system_design'
  content     TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE
);
-- Seed ít nhất 50–100 câu per job_family + level
```

**Bước 3 — Validate JSON output từ Gemini:**
```python
def parse_and_validate(raw_output: str) -> list[Question] | None:
    try:
        # Strip markdown code fences nếu Gemini trả về ```json ... ```
        clean = re.sub(r'```json|```', '', raw_output).strip()
        data = json.loads(clean)
        questions = [Question(**q) for q in data]
        if len(questions) >= MIN_QUESTIONS:
            return questions
    except (json.JSONDecodeError, ValidationError):
        pass
    return None
```

---

### 🔴 Vấn đề 3 — Cache key quá hẹp → câu hỏi lặp lại giữa các users

**Giai đoạn:** Tạo câu hỏi Hybrid

**Mô tả hiện tại:**
```
Cache key = Job ID + Trình độ
→ Q1, Q2, Q3 giống hệt nhau cho mọi user cùng vị trí và level
```

Ví dụ: 100 user cùng phỏng vấn vị trí "Backend Engineer Senior" đều nhận 3 câu hỏi y chang nhau. Nếu một user từng làm phiên trước, lần sau câu hỏi vẫn như cũ.

**Hệ quả:**
- Mất tính công bằng nếu dùng cho thi thật
- Câu hỏi bị "rò rỉ" trong cộng đồng người dùng
- User phỏng vấn lần 2 không học thêm được gì mới

**Hướng cải thiện:**

Chuyển từ cache 3 câu cố định sang **pool câu hỏi + sampling ngẫu nhiên**:

```
Thay vì:   cache[job_id + level] = [Q1, Q2, Q3]  (cố định)

Làm thành: pool[job_family + level + category] = [Q1...Q30]  (pool lớn)
           → Mỗi phiên random.sample(pool, 3)
```

**Schema pool:**
```sql
CREATE TABLE question_pool (
  id           UUID PRIMARY KEY,
  job_family   VARCHAR(100),
  level        VARCHAR(50),
  category     VARCHAR(50),
  content      TEXT NOT NULL,
  source       VARCHAR(20),    -- 'gemini_generated' | 'manual'
  used_count   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pool_lookup ON question_pool(job_family, level, category)
  WHERE source IS NOT NULL;
```

**Logic sampling:**
```python
def pick_core_questions(job_family, level, count=3) -> list[Question]:
    pool = db.query("""
        SELECT * FROM question_pool
        WHERE job_family = %s AND level = %s
        ORDER BY used_count ASC, RANDOM()
        LIMIT %s
    """, [job_family, level, count * 3])  # lấy buffer 3x, rồi sample

    selected = random.sample(pool, min(count, len(pool)))

    # Tăng used_count để ưu tiên câu ít dùng hơn lần sau
    db.execute("UPDATE question_pool SET used_count = used_count + 1
                WHERE id = ANY(%s)", [[q.id for q in selected]])

    return selected
```

**Chiến lược bổ sung pool theo thời gian:**
- Mỗi khi cache miss → Gemini tạo xong → lưu vào pool (không chỉ cache)
- Định kỳ (cronjob hàng tuần) sinh thêm câu hỏi mới vào pool
- Mục tiêu: ≥ 50 câu per `(job_family, level, category)` để đảm bảo đủ randomness

---

### 🟡 Vấn đề 4 — Trả về 5 câu cùng lúc: client biết trước toàn bộ

**Giai đoạn:** Tạo câu hỏi

**Mô tả hiện tại:**
```json
Response /interviews/start:
{
  "questions": [
    { "id": "q1", "content": "..." },
    { "id": "q2", "content": "..." },
    { "id": "q3", "content": "..." },
    { "id": "q4", "content": "..." },
    { "id": "q5", "content": "..." }
  ]
}
```
Toàn bộ 5 câu hỏi nằm trong response đầu tiên. User (hoặc DevTools) có thể thấy trước câu hỏi 3, 4, 5 trước khi trả lời câu 1.

**Hệ quả:**
- Mất yếu tố bất ngờ, không giống phỏng vấn thực
- Dễ gian lận (copy câu hỏi ra ChatGPT chuẩn bị sẵn)
- Không phù hợp nếu sản phẩm hướng đến đánh giá năng lực thật

**Hướng cải thiện:**

Server chỉ expose câu hỏi hiện tại, giữ phần còn lại:

```json
// Response /interviews/start — chỉ trả câu đầu
{
  "sessionId": "sess_abc",
  "totalQuestions": 5,
  "currentQuestion": {
    "index": 1,
    "content": "..."
  }
}

// Response /interviews/submit — trả câu tiếp theo
{
  "answerId": "ans_001",
  "scoreStatus": "pending",
  "nextQuestion": {       // null nếu là câu cuối
    "index": 2,
    "content": "..."
  }
}
```

Backend lưu tất cả câu hỏi trong DB, chỉ query theo `currentIndex` của session:

```python
def get_next_question(session_id: UUID) -> Question | None:
    session = db.get(InterviewSession, session_id)
    return db.query("""
        SELECT * FROM interview_questions
        WHERE session_id = %s AND order_index = %s
    """, [session_id, session.current_index + 1])
```

---

### 🔴 Vấn đề 5 — Không có timeout / circuit breaker cho Gemini

**Giai đoạn:** Tạo câu hỏi + Chấm điểm

**Mô tả hiện tại:**

Không thấy mention timeout hay circuit breaker trong luồng. Nếu Gemini chậm hoặc down, request sẽ treo indefinitely ở cả bước tạo câu hỏi lẫn bước chấm điểm.

**Hướng cải thiện:**

```python
# Timeout riêng biệt cho từng loại call
GEMINI_TIMEOUTS = {
    "generate_questions": 10.0,   # Tạo 5 câu: cho nhiều thời gian hơn
    "score_answer":        6.0,   # Chấm 1 câu: cần nhanh
    "final_report":       20.0,   # Tổng hợp: chấp nhận lâu hơn
}

# Circuit breaker (dùng thư viện như pybreaker hoặc resilience4j)
@circuit_breaker(
    fail_max=5,               # Mở circuit sau 5 lỗi liên tiếp
    reset_timeout=30,         # Thử lại sau 30 giây
    expected_exception=GeminiServiceError
)
async def call_gemini(prompt: str, call_type: str) -> str:
    timeout = GEMINI_TIMEOUTS.get(call_type, 8.0)
    async with asyncio.timeout(timeout):
        return await gemini_client.generate(prompt)
```

**Bảng phân loại lỗi và hành vi:**

| Loại lỗi | Hành vi |
|---|---|
| Timeout tạo câu hỏi | Retry 2 lần → fallback template |
| Timeout chấm điểm | Retry 3 lần → ghi `score = null`, thông báo "Không thể chấm" |
| Rate limit | Exponential backoff tối đa 60s |
| Circuit breaker mở | Dùng toàn bộ template bank, không gọi Gemini |
| JSON parse error | Retry với prompt yêu cầu strict JSON hơn |

---

### 🟡 Vấn đề 6 — Polling thay vì push để nhận điểm

**Giai đoạn:** Phỏng vấn + Chấm điểm async

**Mô tả hiện tại:**

Chấm điểm chạy async (tốt), nhưng không rõ cơ chế nào để client biết khi điểm đã sẵn sàng. Polling là cách đơn giản nhất nhưng tốn tài nguyên nhất.

**Hậu quả của polling:**
```
Mỗi user poll mỗi 2s × 5 câu × 6s chấm/câu ≈ 15 request/user chỉ để nhận điểm
1000 user đồng thời = 15.000 request/phút toàn bộ là "are you done yet?"
```

**Hướng cải thiện — WebSocket:**

```python
# Backend: emit event khi worker chấm xong
@worker.task
async def score_answer_task(answer_id: UUID):
    result = await call_gemini(scoring_prompt, "score_answer")
    score = parse_score(result)
    db.save_score(answer_id, score)

    # Thông báo ngay cho client qua WebSocket
    await websocket_manager.emit(
        room=f"session:{score.session_id}",
        event="score_ready",
        data={
            "questionIndex": score.question_index,
            "score": score.value,
            "feedback": score.feedback,
            "breakdown": score.breakdown
        }
    )
```

```javascript
// Frontend: lắng nghe event
const ws = new WebSocket(`wss://api/interviews/${sessionId}/ws`);

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'score_ready') {
    updateScoreDisplay(data.questionIndex, data.score, data.feedback);
  }
  if (type === 'report_ready') {
    navigateToResult(data.reportId);
  }
};
```

**Nếu WebSocket quá phức tạp để triển khai ngay:** Dùng **Server-Sent Events (SSE)** — một chiều, không cần handshake, nhẹ hơn nhiều so với polling và đủ dùng cho use case này.

---

### 🟡 Vấn đề 7 — Không có cơ chế resume nếu mất kết nối

**Giai đoạn:** Toàn bộ phiên phỏng vấn

**Tình huống xảy ra:**
- User đang trả lời câu 3/5, điện thoại hết pin
- Mạng bị ngắt giữa chừng
- Tab trình duyệt bị đóng nhầm

**Hệ quả hiện tại:** Phiên bị bỏ dở, không có cách nào quay lại. User phải bắt đầu phiên mới với câu hỏi khác (vì pre-generated).

**Hướng cải thiện:**

```python
# API: lấy lại trạng thái phiên đang dang dở
GET /interviews/{sessionId}/state

Response:
{
  "sessionId": "sess_abc",
  "status": "active",
  "currentQuestionIndex": 3,
  "totalQuestions": 5,
  "currentQuestion": {
    "index": 3,
    "content": "..."   # Câu hỏi user đang ở
  },
  "completedAnswers": [
    {
      "questionIndex": 1,
      "scoreStatus": "completed",
      "score": 7.5
    },
    {
      "questionIndex": 2,
      "scoreStatus": "pending"
    }
  ]
}
```

```python
# Session timeout: mark abandoned sau N phút không hoạt động
UPDATE interview_sessions
SET status = 'abandoned'
WHERE status = 'active'
  AND updated_at < NOW() - INTERVAL '30 minutes';

# Cho phép resume trong vòng 24h
def can_resume(session: InterviewSession) -> bool:
    return (
        session.status in ('active', 'abandoned') and
        session.created_at > datetime.now() - timedelta(hours=24)
    )
```

**UX flow khi user quay lại:**
```
User mở app → Phát hiện có phiên dang dở →
Hiển thị dialog: "Bạn có phiên phỏng vấn chưa hoàn thành (câu 3/5). Tiếp tục?"
→ [Tiếp tục] → Resume từ câu 3
→ [Bắt đầu mới] → Hủy phiên cũ, tạo phiên mới
```

---

### 🔴 Vấn đề 8 — Final Report gọi Gemini đồng bộ: bottleneck lớn nhất

**Giai đoạn:** Tổng kết

**Mô tả hiện tại:**
```
User bấm "Hoàn thành"
→ finishSession()
→ Gọi Gemini (toàn bộ chat history + JD) ← BLOCKING, 5–15 giây
→ Nhận báo cáo
→ Hiển thị cho user
```

Đây là thời điểm tệ nhất để có latency: user vừa hoàn thành một phiên căng thẳng, đang hồi hộp chờ kết quả, và hệ thống bắt họ ngồi chờ màn hình trắng 5–15 giây.

**Hướng cải thiện — Pre-generate report từ câu trả lời cuối:**

```
Câu trả lời cuối submit
→ Backend nhận biết đây là câu cuối (index == totalQuestions)
→ Đồng thời:
   [A] Push scoring job vào queue (như bình thường)
   [B] Push report_generation job vào queue (NGAY LẬP TỨC, không chờ)
→ Trả về response cho client bình thường

User bấm "Xem kết quả"
→ GET /interviews/{sessionId}/report
→ Nếu report đã xong: trả về ngay
→ Nếu report chưa xong: trả về { status: "generating", progress: 80 }
   → Frontend hiển thị skeleton loader, poll nhẹ mỗi 2s hoặc nhận WebSocket event
```

```python
# Trong submit_answer handler
async def submit_answer(session_id, question_id, answer_content):
    answer = save_answer(session_id, question_id, answer_content)
    session = get_session(session_id)

    # Push scoring job (luôn luôn)
    await queue.push(ScoringJob(answer_id=answer.id))

    # Kiểm tra câu cuối
    is_last = (session.current_index >= session.total_questions)
    if is_last:
        session.status = 'completing'
        db.save(session)
        # Bắt đầu generate report NGAY, không chờ user bấm nút
        await queue.push(ReportGenerationJob(session_id=session_id))

    return {
        "nextQuestion": None if is_last else get_next_question(session_id),
        "isLastQuestion": is_last
    }
```

**Worker tổng hợp report:**
```python
@worker.task
async def generate_final_report(session_id: UUID):
    # Chờ tất cả scores xong (với timeout 30s)
    await wait_for_all_scores(session_id, timeout=30)

    session = get_session(session_id)
    all_answers = get_all_answers_with_scores(session_id)

    prompt = build_report_prompt(
        jd=session.jd_content,
        answers=all_answers
    )

    report = await call_gemini(prompt, "final_report")
    save_report(session_id, report)

    # Notify client
    await websocket_manager.emit(
        room=f"session:{session_id}",
        event="report_ready",
        data={"reportId": report.id}
    )
```

**Kết quả sau cải thiện:**
```
User submit câu cuối → Nhận "Hoàn thành!" ngay lập tức
User bấm "Xem kết quả" (5–10s sau khi đọc summary) → Report đã sẵn sàng
Thay vì: User bấm "Hoàn thành" → Chờ 10 giây màn hình trắng → Thấy kết quả
```

---

### 🟡 Vấn đề 9 — Thiếu idempotency cho submit answer

**Giai đoạn:** Phỏng vấn

**Tình huống:** User bấm "Nộp" → mạng chậm → user bấm lại → server nhận 2 request → tạo ra 2 answer record cho cùng 1 câu hỏi → điểm bị tính 2 lần.

**Hướng cải thiện:**

```python
# Client gửi kèm idempotency key
POST /interviews/{sessionId}/submit
Headers:
  Idempotency-Key: client-generated-uuid-per-submission
Body:
  { questionId, answerContent }

# Server: check trước khi xử lý
async def submit_answer(session_id, question_id, answer_content, idempotency_key):
    existing = db.query("""
        SELECT id FROM interview_answers
        WHERE idempotency_key = %s
    """, [idempotency_key])

    if existing:
        # Đã xử lý rồi, trả về kết quả cũ
        return get_cached_submit_response(existing.id)

    # Xử lý bình thường và lưu idempotency_key
    answer = save_answer(..., idempotency_key=idempotency_key)
    ...
```

---

### 🟣 Vấn đề 10 — Thiếu observability: không biết lỗi xảy ra ở đâu

**Giai đoạn:** Toàn bộ hệ thống

**Hiện trạng:** Khi user báo "phiên của tôi bị lỗi", không có đủ thông tin để debug: không rõ Gemini fail hay queue chết hay DB timeout.

**Hướng cải thiện — Distributed tracing tối thiểu:**

```python
# Gắn sessionId vào mọi log
import structlog
logger = structlog.get_logger()

async def generate_questions(session_id, ...):
    log = logger.bind(session_id=str(session_id), stage="question_generation")
    log.info("start")
    try:
        result = await call_gemini(...)
        log.info("success", question_count=len(result))
        return result
    except TimeoutError:
        log.error("gemini_timeout", timeout_seconds=TIMEOUT)
        raise
    except Exception as e:
        log.error("unexpected_error", error=str(e))
        raise
```

**Metrics cần track tối thiểu:**

| Metric | Mục đích |
|---|---|
| `gemini_latency_p99` by call_type | Phát hiện Gemini chậm dần |
| `session_completion_rate` | Tỷ lệ phiên hoàn thành vs bỏ giữa chừng |
| `cache_hit_rate` by job_family+level | Đánh giá hiệu quả cache pool |
| `scoring_queue_depth` | Phát hiện worker bị tắc |
| `report_generation_duration` | Đo thực tế thời gian user chờ kết quả |

---

## Lộ Trình Triển Khai

### Sprint 1 — Ưu tiên cao (1 tuần)

- [ ] **Vấn đề 8**: Pre-generate report từ câu trả lời cuối (impact UX cao nhất)
- [ ] **Vấn đề 5**: Thêm timeout + retry logic cho tất cả Gemini calls
- [ ] **Vấn đề 2**: Template question bank làm fallback

### Sprint 2 — Cải thiện chất lượng (1 tuần)

- [ ] **Vấn đề 3**: Chuyển cache → question pool + random sampling
- [ ] **Vấn đề 4**: Chỉ expose từng câu hỏi theo index, không trả hết 5 câu
- [ ] **Vấn đề 9**: Idempotency key cho submit answer

### Sprint 3 — Nâng cao (tuỳ ưu tiên)

- [ ] **Vấn đề 6**: WebSocket hoặc SSE thay thế polling
- [ ] **Vấn đề 7**: Session resume trong 24h
- [ ] **Vấn đề 1**: Loại bỏ Job ảo / Application khỏi luồng mock
- [ ] **Vấn đề 10**: Structured logging + metrics dashboard

---

## Tóm Tắt Impact Sau Khi Fix

| Chỉ số | Trước | Sau |
|---|---|---|
| Latency nhận kết quả cuối | 5–15 giây blocking | < 1 giây (pre-generated) |
| Tỷ lệ phiên thất bại do Gemini | Không đo được | < 0.5% (có fallback) |
| Câu hỏi trùng lặp giữa users | 100% Q1–Q3 giống nhau | < 10% (pool ≥ 50 câu) |
| Request polling dư thừa | ~15 req/user chỉ để nhận điểm | 0 (push-based) |
| Khả năng debug khi lỗi | Gần như không có | Full trace theo sessionId |
