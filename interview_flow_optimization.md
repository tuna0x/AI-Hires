# Tối ưu Luồng Phỏng vấn AI — Từ Sequential sang Pipeline

## Vấn đề hiện tại

### Luồng hiện tại (Sequential — Chậm)

```
User trả lời câu N
        ↓ (user chờ)
AI đọc câu trả lời
        ↓ (user vẫn chờ)
AI chấm điểm + sinh feedback
        ↓ (user vẫn chờ)
AI sinh câu hỏi N+1
        ↓
Hiển thị feedback + câu hỏi mới
```

**Thời gian chờ thực tế mỗi lượt:** 4–8 giây
**Cảm giác của user:** Bấm nộp → màn hình đứng yên → chờ → chờ → kết quả xuất hiện

### Tại sao chậm?

AI đang làm **3 việc độc lập nhưng xử lý tuần tự**:

| Việc | Phụ thuộc vào | Thời gian |
|---|---|---|
| Chấm điểm câu N | Câu hỏi N + Câu trả lời N | ~1.5s |
| Sinh feedback | Kết quả chấm điểm | ~1.5s |
| Sinh câu hỏi N+1 | Toàn bộ context buổi phỏng vấn | ~2–3s |
| **Tổng** | | **~5–7s mỗi lượt** |

Vấn đề cốt lõi: **Chấm điểm và sinh câu hỏi tiếp theo KHÔNG cần đợi nhau** — chúng có thể chạy song song.

---

## Giải pháp — 3 hướng từ đơn giản đến nâng cao

---

### Hướng 1 — Parallel Processing (Đơn giản, hiệu quả nhất)

**Ý tưởng:** Tách thành 2 lệnh gọi AI chạy **đồng thời** thay vì tuần tự.

```
User nộp câu trả lời N
        ↓
Backend nhận request
        ├── [Song song] Gọi AI: Chấm điểm câu N      (~1.5s)
        └── [Song song] Gọi AI: Sinh câu hỏi N+1     (~2s)
        ↓
Chờ cả 2 hoàn thành (max của 2, không phải tổng)
        ↓
Trả về: feedback câu N + câu hỏi N+1 cùng lúc
```

**Kết quả:**
- Trước: 5–7s
- Sau: ~2–2.5s (bằng thời gian của tác vụ dài nhất)
- **Tiết kiệm ~60% thời gian chờ**

**Điều kiện áp dụng:**
- Câu hỏi N+1 KHÔNG cần biết điểm câu N trước (adaptive interview — xem Hướng 3)
- Câu hỏi bank (generic): sinh sẵn, không cần gọi AI → latency = 0
- Câu hỏi CV-based: gọi AI song song với việc chấm điểm

**Lưu ý quan trọng:**
Hướng này chỉ hoạt động tốt khi câu hỏi tiếp theo **không phụ thuộc vào chất lượng câu trả lời trước**. Nếu muốn adaptive (câu trả lời tệ → hỏi dễ hơn), cần Hướng 3.

---

### Hướng 2 — Pre-generation (Không chờ AI sau mỗi câu)

**Ý tưởng:** Sinh **toàn bộ câu hỏi ngay từ đầu buổi**, lưu sẵn vào DB/cache. Trong buổi phỏng vấn chỉ còn việc chấm điểm.

```
Trước buổi phỏng vấn (lúc user ấn "Bắt đầu"):
        ↓
Sinh đồng thời tất cả 5 câu hỏi (1 lần gọi AI duy nhất)
        ↓
Lưu vào cache với key: session:{id}:questions
        ↓
─────────────────────────────────────────
Trong buổi phỏng vấn:
        ↓
User trả lời câu N
        ↓ (chỉ chấm điểm, không sinh câu mới)
AI chấm điểm câu N                         (~1.5s)
        ↓
Lấy câu N+1 từ cache                       (~0ms)
        ↓
Hiển thị ngay
```

**Kết quả:**
- Thời gian chờ sau mỗi câu: **~1.5s** (chỉ chấm điểm)
- Token sinh câu hỏi: tiết kiệm vì gọi 1 lần thay vì 5 lần
- Đánh đổi: Toàn bộ 5 câu hỏi cố định từ đầu → không adaptive

**Phù hợp với:**
- Câu hỏi bank (generic) — luôn pre-generate được
- Mock interview không cần adaptive
- User muốn xem trước câu hỏi để chuẩn bị

**Không phù hợp với:**
- Real interview cần adaptive theo câu trả lời
- CV-based questions cần context câu trả lời trước

---

### Hướng 3 — Adaptive Pipeline (Nâng cao, UX tốt nhất)

**Ý tưởng:** Kết hợp cả hai hướng trên + thêm **streaming feedback** để user không cảm giác chờ.

```
Khởi tạo buổi phỏng vấn:
├── Pre-generate câu 1, 2, 3 (bank/JD-based) → cache
└── Câu 4, 5 (CV-based) → sinh real-time khi đến lượt

─────────────────────────────────────────────────────
Khi user nộp câu trả lời N:

[Ngay lập tức — 0ms]
→ Hiển thị "Đang phân tích câu trả lời của bạn..."
→ Progress indicator chạy

[Song song — ~1.5s]
├── Stream feedback từng từ về FE (user thấy chữ xuất hiện dần)
└── Nếu N < 3: lấy câu N+1 từ cache (0ms)
    Nếu N = 3: bắt đầu sinh câu 4 (CV-based) song song với chấm điểm

[Sau ~2s]
→ Feedback hiển thị xong
→ Câu N+1 đã sẵn sàng
→ Nút "Câu tiếp theo" xuất hiện
```

**Adaptive logic — câu hỏi thay đổi theo chất lượng trả lời:**

```
Điểm câu N < 4/10  → Câu N+1 hỏi lại chủ đề đó ở góc độ đơn giản hơn
Điểm câu N 4–7/10  → Câu N+1 theo kế hoạch ban đầu
Điểm câu N > 7/10  → Câu N+1 đào sâu hơn, phức tạp hơn
```

Lưu ý: Adaptive chỉ áp dụng cho câu CV-based (câu 4, 5). Câu bank (1, 2, 3) giữ nguyên vì đã cache sẵn.

**Kết quả:**
- Cảm giác chờ của user: **gần như 0** (vì thấy chữ xuất hiện dần ngay)
- Chất lượng câu hỏi: cao nhất (adaptive theo năng lực thực tế)
- Độ phức tạp triển khai: cao nhất

---

## So sánh 3 hướng

| Tiêu chí | Hiện tại | Hướng 1 — Parallel | Hướng 2 — Pre-gen | Hướng 3 — Adaptive |
|---|---|---|---|---|
| Thời gian chờ/lượt | 5–7s | ~2s | ~1.5s | ~0s (streaming) |
| Adaptive theo câu trả lời | ❌ | ❌ | ❌ | ✅ |
| Độ phức tạp backend | Thấp | Thấp | Trung bình | Cao |
| Token cost | Cao nhất | Trung bình | Thấp nhất | Trung bình |
| Phù hợp mock interview | ✅ | ✅ | ✅ tốt nhất | ✅ |
| Phù hợp real interview | ⚠️ | ✅ | ⚠️ | ✅ tốt nhất |
| Thời gian triển khai | — | 1–2 ngày | 2–3 ngày | 1–2 tuần |

---

## Khuyến nghị theo giai đoạn

### Giai đoạn 1 — MVP (Làm ngay)

**Áp dụng Hướng 1 + một phần Hướng 2**

Cụ thể:
- Câu 1, 2, 3 (bank): pre-generate lúc bắt đầu session, lưu cache → latency = 0
- Câu 4, 5 (CV-based): gọi AI song song với chấm điểm câu trước → chờ ~2s
- Chấm điểm: tách riêng `evaluateAnswerOnly` (giữ nguyên từ Opus 4.6)

**Kết quả thực tế:**
- Câu 1, 2, 3: Nộp xong → feedback sau 1.5s, câu tiếp theo hiện ngay
- Câu 4, 5: Nộp xong → chờ ~2s → nhận cả feedback lẫn câu tiếp theo

---

### Giai đoạn 2 — Production (Sau khi có user thực)

**Bổ sung Streaming feedback**

Thay vì đợi AI trả về đầy đủ rồi hiển thị một lúc, dùng Server-Sent Events (SSE) để stream từng phần feedback về FE ngay khi AI sinh ra:

```
AI đang sinh: "Câu trả lời của bạn..."     → FE hiển thị ngay
AI tiếp:      " thể hiện sự hiểu biết..."  → FE append tiếp
AI tiếp:      " tốt về concept..."         → FE append tiếp
```

User thấy chữ xuất hiện dần → cảm giác "AI đang đọc và suy nghĩ" thay vì màn hình đứng im.

---

### Giai đoạn 3 — Scale (Khi có nhiều user đồng thời)

**Tách Interview Service thành worker riêng**

Vấn đề: 10 user cùng nộp câu trả lời = 10 lần gọi Gemini đồng thời → rate limit, timeout.

Giải pháp:
- Đẩy mỗi `submitAnswer` vào message queue (Redis Queue / RabbitMQ)
- Worker pool xử lý tuần tự theo priority
- FE polling hoặc WebSocket nhận kết quả khi sẵn sàng
- User thấy "Đang chấm điểm..." thay vì màn hình trắng

---

## Vấn đề phụ — Context window khi chấm điểm

### Vấn đề
Hiện tại khi chấm điểm, AI cần đọc lại toàn bộ lịch sử buổi phỏng vấn để hiểu context → token tăng theo từng câu → câu 5 tốn gấp 5 lần câu 1.

### Giải pháp — Tóm tắt context lũy tiến

Thay vì truyền toàn bộ lịch sử, duy trì 1 `running_summary` cập nhật sau mỗi câu:

```
Sau câu 1: summary = "Ứng viên hiểu REST API ở mức trung bình, thiếu ví dụ thực tế."
Sau câu 2: summary = "...+ Kinh nghiệm Elasticsearch tốt, đã tối ưu được latency."
Sau câu 3: summary = "...+ Yếu về system design, không đề cập đến scalability."
```

Khi sinh câu 4: truyền `summary` (~50 tokens) thay vì 3 cặp Q&A đầy đủ (~500 tokens) → **tiết kiệm ~90% token context**.

Lưu `running_summary` vào `interview_sessions.config` JSON column — không cần bảng mới.

---

## Tóm tắt — Thứ tự ưu tiên triển khai

| Ưu tiên | Việc cần làm | Tác động | Độ khó |
|---|---|---|---|
| 1 | Pre-generate câu 1,2,3 vào cache khi start session | Latency = 0 cho 60% câu hỏi | Thấp |
| 2 | Chạy song song: chấm điểm + sinh câu CV-based | Giảm 60% thời gian chờ | Thấp |
| 3 | Running summary thay thế full history | Giảm 90% token context | Thấp |
| 4 | Streaming feedback qua SSE | UX tốt hơn, không cảm giác chờ | Trung bình |
| 5 | Adaptive difficulty theo điểm | Chất lượng câu hỏi cao hơn | Cao |
| 6 | Message queue cho concurrent users | Scale khi có nhiều user | Cao |
