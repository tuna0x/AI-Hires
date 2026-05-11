# 🎯 Đề Xuất Cải Thiện Luồng Mock Interview — ScanCV

> **Vấn đề cốt lõi:** Hiện tại hệ thống tạo câu hỏi *on-demand* (real-time khi cần), khiến người dùng phải chờ sau mỗi lượt trả lời → trải nghiệm bị ngắt quãng, thiếu liền mạch.

---

## 1. Root Cause Analysis

```
[User bắt đầu phiên]
      ↓
[API Gemini → tạo câu hỏi 1]   ← latency lần 1
      ↓
[User trả lời câu 1]
      ↓
[API Gemini → chấm điểm + tạo câu hỏi 2]   ← latency lần 2 (BLOCKING)
      ↓
[User chờ... chờ... rồi mới thấy câu hỏi 2]
      ↓
... lặp lại N lần
```

**Hệ quả:**
- Mỗi vòng lặp đều có ít nhất 1 blocking API call
- Scoring + question generation chạy tuần tự → tốn gấp đôi thời gian
- UX bị "giật cục", người dùng mất tập trung và cảm giác bị kiểm tra máy móc

---

## 2. Hướng Đề Xuất: Pre-generation + Async Scoring

Tách biệt hoàn toàn hai luồng:

| Luồng | Trách nhiệm | Thời điểm chạy |
|---|---|---|
| **Question Pipeline** | Sinh toàn bộ câu hỏi trước | Khi bắt đầu phiên |
| **Scoring Pipeline** | Chấm điểm từng câu | Ngay sau khi user submit, chạy **non-blocking** |

---

## 3. Kiến Trúc Đề Xuất Chi Tiết

### 3.1 Pre-generate Toàn Bộ Câu Hỏi Khi Bắt Đầu Phiên

**Nguyên tắc:** Tại thời điểm `POST /interviews/start`, sinh **tất cả N câu hỏi** cùng một lúc qua Gemini, lưu vào DB/cache, sau đó trả về ngay cho client.

```
POST /interviews/start
{
  "jobTitle": "Backend Engineer",
  "level": "Senior",
  "questionCount": 5
}

→ Response (sau 2–3s duy nhất, không có latency về sau):
{
  "sessionId": "sess_abc123",
  "totalQuestions": 5,
  "firstQuestion": {
    "id": "q1",
    "content": "Bạn xử lý N+1 query problem như thế nào?"
  }
}
```

**Phía backend — Session Initialization Flow:**

```
[Start Session Request]
        ↓
[Gọi Gemini 1 lần duy nhất]
  Prompt: "Tạo 5 câu hỏi phỏng vấn Backend Senior,
           trả về JSON array, không giải thích thêm"
        ↓
[Parse & validate JSON questions]
        ↓
[Lưu toàn bộ vào DB]
  session: { id, status, questions: [...], currentIndex: 0 }
        ↓
[Trả về câu hỏi đầu tiên cho client]
```

**Lợi ích:**
- Chỉ có **1 lần chờ duy nhất** ở đầu phiên (user chấp nhận được vì đang "khởi động")
- Từ câu 2 trở đi: **instant** — chỉ cần query DB

---

### 3.2 Async Scoring — Không Block Câu Hỏi Tiếp Theo

Khi user submit câu trả lời, **trả về câu hỏi tiếp theo ngay lập tức**, đẩy việc chấm điểm vào background job.

```
POST /interviews/{sessionId}/answer
{
  "questionId": "q1",
  "answer": "Tôi sử dụng eager loading và DataLoader..."
}

→ Response NGAY LẬP TỨC (< 100ms):
{
  "nextQuestion": {
    "id": "q2",
    "content": "Giải thích CAP theorem trong distributed systems?"
  },
  "scoreStatus": "pending",   ← chấm điểm đang chạy background
  "scoreId": "score_xyz"
}
```

**Background Job (Queue-based):**

```
[Answer submitted]
      ↓
[Push vào Queue: { sessionId, questionId, answer }]
      ↓                              ↓
[Return next question]     [Worker: Gọi Gemini scoring]
  (immediate)                        ↓
                             [Lưu điểm vào DB]
                                     ↓
                             [Emit event: score_ready]
                                     ↓
                             [Client nhận qua WebSocket/polling]
```

---

### 3.3 Luồng Hoàn Chỉnh (Happy Path)

```
T=0s    User click "Bắt đầu phỏng vấn"
T=2s    Nhận câu hỏi 1 (Gemini đã sinh xong 5 câu, lưu DB)

T=30s   User submit trả lời câu 1
T=30s   Nhận câu hỏi 2 NGAY LẬP TỨC (lấy từ DB)
T=33s   Điểm câu 1 hiện ra (background scoring xong)

T=60s   User submit trả lời câu 2
T=60s   Nhận câu hỏi 3 NGAY LẬP TỨC
...

T=kết thúc   Tổng kết: tất cả điểm đã có sẵn → hiển thị ngay
```

---

## 4. Database Schema Gợi Ý

```sql
-- Phiên phỏng vấn
CREATE TABLE interview_sessions (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL,
  job_title   VARCHAR(255),
  level       VARCHAR(50),
  status      ENUM('generating', 'active', 'completed'),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Câu hỏi (pre-generated, lưu tuần tự)
CREATE TABLE interview_questions (
  id           UUID PRIMARY KEY,
  session_id   UUID REFERENCES interview_sessions(id),
  order_index  INT NOT NULL,        -- thứ tự câu hỏi
  content      TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Câu trả lời + điểm (tách riêng, async)
CREATE TABLE interview_answers (
  id           UUID PRIMARY KEY,
  question_id  UUID REFERENCES interview_questions(id),
  content      TEXT,
  score        DECIMAL(4,2),        -- NULL khi chưa chấm xong
  feedback     TEXT,
  scored_at    TIMESTAMP,           -- NULL nếu pending
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API Contract Mới

### `POST /interviews/start`
Khởi tạo phiên, sinh toàn bộ câu hỏi.

```json
Response 201:
{
  "sessionId": "sess_abc",
  "status": "active",
  "totalQuestions": 5,
  "currentQuestion": {
    "id": "q_001",
    "index": 1,
    "content": "..."
  }
}
```

### `POST /interviews/{sessionId}/submit`
Nộp câu trả lời, nhận câu hỏi tiếp theo ngay.

```json
Response 200:
{
  "answerId": "ans_001",
  "scoreStatus": "pending",
  "nextQuestion": {              // null nếu là câu cuối
    "id": "q_002",
    "index": 2,
    "content": "..."
  },
  "isLastQuestion": false
}
```

### `GET /interviews/{sessionId}/scores`
Polling hoặc dùng sau khi nhận WebSocket event.

```json
Response 200:
{
  "scores": [
    {
      "questionId": "q_001",
      "score": 8.5,
      "feedback": "Câu trả lời tốt, có thể bổ sung thêm...",
      "status": "completed"
    },
    {
      "questionId": "q_002",
      "score": null,
      "status": "pending"
    }
  ]
}
```

### `GET /interviews/{sessionId}/result`
Kết quả toàn phiên (gọi sau khi hoàn thành).

```json
Response 200:
{
  "sessionId": "sess_abc",
  "totalScore": 7.8,
  "summary": "...",
  "questions": [ /* full detail mỗi Q&A + điểm */ ]
}
```

---

## 6. Gemini Prompt Engineering

### Sinh câu hỏi (1 lần, batch)

```
Bạn là chuyên gia phỏng vấn kỹ thuật.
Tạo đúng {N} câu hỏi phỏng vấn cho vị trí {jobTitle} level {level}.

Yêu cầu:
- Câu hỏi đa dạng: kỹ thuật, system design, behavioral
- Độ khó tăng dần từ câu 1 đến câu {N}
- Mỗi câu hỏi rõ ràng, không mơ hồ

Trả về JSON array ONLY, không giải thích:
[
  { "index": 1, "content": "...", "category": "technical" },
  ...
]
```

### Chấm điểm (async, per answer)

```
Bạn là giám khảo phỏng vấn kỹ thuật khắt khe nhưng công bằng.

Câu hỏi: {question}
Câu trả lời của ứng viên: {answer}

Chấm điểm từ 1–10 và đưa ra feedback ngắn gọn (2–3 câu).
Trả về JSON ONLY:
{
  "score": 7.5,
  "feedback": "...",
  "strengths": ["..."],
  "improvements": ["..."]
}
```

---

## 7. Xử Lý Edge Cases

| Tình huống | Xử lý |
|---|---|
| Gemini timeout khi khởi tạo | Retry 2 lần, nếu fail → báo lỗi trước khi vào phiên |
| Gemini trả về JSON không hợp lệ | Validate + fallback sang câu hỏi template mặc định |
| Scoring job fail | Retry 3 lần với exponential backoff; nếu vẫn fail → ghi `score = null`, hiển thị "Không thể chấm điểm" |
| User bỏ giữa chừng (session timeout) | Đánh dấu session `abandoned`, vẫn giữ dữ liệu để resume |
| Câu trả lời quá ngắn/trống | Validate phía client trước khi submit, score = 0 tự động |

---

## 8. Lộ Trình Triển Khai (Ưu Tiên Theo Impact)

### Phase 1 — Quick Win (1–2 ngày)
- [ ] Refactor `start session`: sinh tất cả câu hỏi 1 lần, lưu DB
- [ ] `submit answer`: trả về câu hỏi tiếp từ DB thay vì gọi Gemini

### Phase 2 — Async Scoring (2–3 ngày)
- [ ] Tích hợp job queue (BullMQ / Celery tùy stack)
- [ ] Worker chấm điểm chạy background
- [ ] Polling endpoint hoặc WebSocket để client nhận điểm

### Phase 3 — UX Polish (1–2 ngày)
- [ ] Loading state khi khởi tạo phiên ("Đang chuẩn bị câu hỏi...")
- [ ] Score hiện ra dần dần khi có (skeleton → score)
- [ ] Session resume nếu mất kết nối

---

## 9. Tóm Tắt So Sánh

| | Hiện tại | Sau cải thiện |
|---|---|---|
| Số lần gọi Gemini | N câu × 2 (tạo + chấm) | 1 lần tạo + N lần chấm async |
| Latency giữa các câu | 2–5s (blocking) | ~0ms (lấy từ DB) |
| Trải nghiệm người dùng | Giật cục, chờ đợi | Mượt mà, liên tục |
| Điểm số | Chờ mới qua câu tiếp | Hiện ra trong nền |
| Khả năng mở rộng | Kém (sequential) | Tốt (parallel workers) |

---

> **Kết luận:** Chỉ cần thay đổi chiến lược từ *generate-on-demand* sang *pre-generate + async score* là giải quyết được hầu hết vấn đề UX mà không cần thay đổi model AI hay cơ sở hạ tầng lớn. Phase 1 có thể ship ngay trong 1–2 ngày và đã tạo ra sự khác biệt rõ rệt.
