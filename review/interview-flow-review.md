# Interview Flow — Review & Gaps

Date: 2026-05-12

---

## 1. Những gì đang tốt

**P0 security ownership check** được đặt đúng vị trí ưu tiên. Lỗi IDOR dạng này thường bị bỏ qua với lý do "sessionId là UUID, khó đoán" — doc nhận ra đúng rủi ro.

**Async scoring + trigger report after commit** mô tả rõ cơ chế `afterCommit()` để tránh publish trước khi transaction commit — detail quan trọng thường bị bỏ qua.

**Fallback câu hỏi cứng** khi Gemini fail — tránh session bị treo ở bước khởi tạo.

**`runningSummary` pattern** trong scoring worker — thay vì gửi toàn bộ lịch sử mỗi lần, chỉ update summary rolling. Tiết kiệm token và giảm latency.

---

## 2. Gaps cần bổ sung

### 🔴 P0 — Mock session thiếu `createdByUserId`

Doc đề xuất thêm `createdByUserId` như một "khuyến nghị". Đây phải là **requirement bắt buộc** — không có field này thì ownership check cho mock session không thể implement, security fix sẽ incomplete.

---

### 🔴 P0 — `fixSchema()` ALTER TABLE lock risk trên production

`ALTER TABLE` trong `@PostConstruct` chạy mỗi lần app start. Trên production, điều này có thể gây lock table trong lúc traffic đang chạy. Cần migrate sang Flyway/Liquibase **trước khi** deploy production, không phải P3.

---

### 🟠 P1 — Scoring worker partial save: `runningSummary` có thể stale

Khi exception xảy ra **sau** khi save `InterviewEvaluation` nhưng **trước** khi update `session.runningSummary` → summary bị stale. Report cuối sẽ generate dựa trên incomplete context mà không có lỗi nào được throw. Cần wrap cả hai thao tác trong cùng transaction hoặc update summary trước.

---

### 🟠 P1 — Concurrent report trigger race condition

Nếu 5 scoring jobs chạy song song và commit gần nhau, tất cả đều gọi `checkAndTriggerReportGeneration`. Điều kiện `pendingCount == 0 && answeredCount >= 5` có thể thỏa mãn bởi nhiều worker cùng lúc → trigger report nhiều lần. `afterCommit()` không đủ bảo vệ khi các transaction commit gần nhau.

Cần DB-level idempotency: optimistic lock hoặc `INSERT IF NOT EXISTS` cho report generation trigger.

---

### 🟠 P1 — Idempotency scoring worker chưa được xác nhận

Doc đặt câu hỏi "có check `answer.getInterviewEvaluation() != null` chưa?" nhưng để mở. Đây là gap cần xác nhận rõ — nếu chưa có check thì outbox re-deliver hoặc consumer restart sẽ chấm điểm lại cùng answer, overwrite evaluation cũ.

---

### 🟠 P1 — DLQ nên tách riêng nếu production đang live

Hiện dùng chung `CV_DLX/CV_DLQ` cho cả CV scan và interview scoring. Nếu interview scoring DLQ bị flood sẽ ảnh hưởng monitoring CV scan và ngược lại. Nếu cả hai flow đang chạy trên production, việc tách DLQ nên được nâng lên P1.

---

### 🟠 P1 — `finishSession` semantics chưa được quyết định

Doc đề xuất `COMPLETED_REQUESTED` hoặc `FINISHED` nhưng chưa chọn. Cần làm rõ trước khi implement: nếu client gọi `/finish` mà chưa answer đủ 5 câu thì chặn hay cho phép generate partial report? Đây là business decision, không phải technical decision.

---

### 🟡 P2 — `maxOutputTokens` thiếu trong scoring config

`evaluateAndSummarizeAnswer` dùng timeout 15s nhưng không cap output tokens. Nếu model trả response bất thường dài (edge case với answer dài), có thể timeout trước khi nhận đủ JSON → parse fail → fallback `score=0`. Cần thêm `maxOutputTokens` vào generationConfig của scoring prompt.

---

## 3. Nhận xét cấu trúc doc

**Section 9 next steps** có phân tầng P0–P3 rõ nhưng thiếu dependency giữa các items. Cụ thể: P0 ownership check **phụ thuộc vào** việc thêm `createdByUserId` vào mock session — hai items này cần được link và implement cùng nhau.

---

## 4. Tổng hợp gaps theo priority

| Gap | Priority |
|---|---|
| Mock session thiếu `createdByUserId` — ownership fix incomplete | 🔴 P0 |
| `fixSchema()` ALTER TABLE lock risk trên production | 🔴 P0 |
| Scoring worker partial save — `runningSummary` stale sau exception | 🟠 P1 |
| Concurrent report trigger race condition | 🟠 P1 |
| Idempotency scoring worker chưa được xác nhận | 🟠 P1 |
| DLQ tách riêng nếu production đang live | 🟠 P1 |
| `finishSession` semantics chưa được quyết định | 🟠 P1 |
| `maxOutputTokens` thiếu trong scoring config | 🟡 P2 |
