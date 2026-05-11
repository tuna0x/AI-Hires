# 📋 Senior Code Review — CV Scan Workflow & Database Schema

> **Tổng đánh giá:** Kiến trúc có tư duy tốt, đặc biệt phần parallel Gemini call và hash-based cache. Tuy nhiên còn một số vấn đề cần giải quyết trước khi scale, từ thiết kế schema cho đến độ bền của luồng xử lý.  
> **Mức độ:** 🔴 Nghiêm trọng · 🟡 Cần cải thiện · 🟢 Tốt · 🟣 Đề xuất nâng cao

---

## Điểm Mạnh Cần Ghi Nhận 🟢

Trước khi đi vào vấn đề, cần acknowledge những quyết định thiết kế đúng:

| # | Điểm tốt | Lý do |
|---|---|---|
| 1 | **Hash SHA-256 dedup** | Tránh gọi Gemini thừa, tiết kiệm chi phí API và thời gian ~11s |
| 2 | **Parallel Gemini calls** (CompletableFuture) | ATS + Structured Profile chạy song song, giảm latency từ ~22s → ~11s |
| 3 | **Tách schema 2 nhóm** rõ ràng | Normalized Profile vs ATS Report phục vụ đúng 2 use case khác nhau |
| 4 | **23 tiêu chí ATS granular** | Đủ chi tiết để render biểu đồ radar, highlight điểm yếu cụ thể |
| 5 | **`display_order` trong Experience/Education** | Kiểm soát thứ tự hiển thị phía frontend, không phụ thuộc insert order |

---

## I. Vấn Đề Trong Luồng Thực Thi (Execution Flow)

---

### 🔴 Vấn đề 1 — Cache Hit trả về "bản cũ": sai về logic nghiệp vụ

**Vị trí:** Bước `alt Cache Hit`

**Luồng hiện tại:**
```
File hash trùng → Trả về bản Resume cũ → Phản hồi ngay lập tức
```

**Vấn đề:**
Hash SHA-256 hash của **file** — không phải hash của nội dung CV sau khi parse. Điều này dẫn đến nhiều edge case:

- **User A** upload CV, quét xong.
- **User B** tình cờ upload cùng file CV đó (clone từ template) → **Hệ thống trả về kết quả của User A**. Đây là rò rỉ dữ liệu nghiêm trọng nếu không có thêm điều kiện lọc theo `user_id`.
- **User A** upload lại đúng file cũ, muốn quét lại sau khi sửa CV bằng cách copy-paste (nội dung thay đổi nhưng tên file, size vẫn y chang) → Không được vì hash giống nhau → Không nhận ra CV đã thay đổi.

**Cách fix:**

Tách bạch 2 mục đích của hash:

```sql
-- Trong bảng Resume, đổi file_hash thành content_hash
-- Hash của extracted_text (sau khi parse), không phải file bytes
ALTER TABLE resume ADD COLUMN content_hash VARCHAR(64);

-- Index phải kèm user_id để tránh cross-user cache hit
CREATE UNIQUE INDEX idx_resume_user_content_hash
  ON resume(user_id, content_hash);
```

```java
// Logic kiểm tra
String contentHash = sha256(extractedText);  // Hash NỘI DUNG, không phải file bytes
Optional<Resume> cached = resumeRepo.findByUserIdAndContentHash(userId, contentHash);

if (cached.isPresent()) {
    return cached.get();  // Safe: cùng user, cùng nội dung
}
```

Bổ sung thêm cột `file_hash` (hash bytes gốc) dùng riêng để phát hiện file y chang (dedup storage MinIO), tách khỏi logic cache parse result.

---

### 🔴 Vấn đề 2 — Không có xử lý lỗi từng bước: một bước fail = mất hết

**Vị trí:** Toàn bộ nhánh `else Cache Miss`

**Luồng hiện tại:**
```
Upload MinIO → Parse text → [Parallel Gemini A + B] → Save DB
```
Không có checkpoint nào. Nếu MinIO upload xong nhưng Gemini timeout → file đã lên MinIO nhưng không có record nào trong DB → file mồ côi, user nhận lỗi chung chung, không thể retry.

**Hệ quả thực tế:**
- File tích tụ trên MinIO không có record tương ứng → lãng phí storage
- User không biết thất bại ở đâu → không thể retry thông minh
- Nếu Gemini timeout sau khi đã upload, user upload lại → tạo file mới trên MinIO nhưng hash vẫn chưa có trong DB → vòng lặp lỗi

**Hướng cải thiện — Checkpoint-based flow:**

```java
// Bước 1: Tạo Resume record với status = PROCESSING trước
Resume resume = Resume.builder()
    .userId(userId)
    .parseStatus(ParseStatus.PROCESSING)
    .build();
resumeRepo.save(resume);  // Có ID ngay từ đầu

try {
    // Bước 2: Upload MinIO
    String fileUrl = minioService.upload(file, userId);
    resume.setFileUrl(fileUrl);
    resumeRepo.save(resume);

    // Bước 3: Extract text
    String extractedText = parserService.extract(file);
    resume.setExtractedText(extractedText);
    resumeRepo.save(resume);  // Save từng bước

    // Bước 4: Parallel Gemini
    CompletableFuture<String> atsFuture = callGeminiAts(extractedText);
    CompletableFuture<String> profileFuture = callGeminiProfile(extractedText);
    CompletableFuture.allOf(atsFuture, profileFuture)
        .orTimeout(30, TimeUnit.SECONDS)
        .join();

    // Bước 5: Save kết quả
    populateAndSave(resume, atsFuture.get(), profileFuture.get());
    resume.setParseStatus(ParseStatus.DONE);

} catch (TimeoutException e) {
    resume.setParseStatus(ParseStatus.FAILED);
    resume.setFailureReason("GEMINI_TIMEOUT");
    resumeRepo.save(resume);
    // Trigger retry job
    retryQueue.push(new RetryParseJob(resume.getId()));
}
```

---

### 🔴 Vấn đề 3 — Parallel Gemini calls không có timeout riêng biệt

**Vị trí:** Bước 4 — `CompletableFuture.allOf`

**Vấn đề:** `allOf` không có timeout mặc định. Nếu 1 trong 2 call treo indefinitely (Gemini rate limit, network drop), toàn bộ request của user treo theo — thread bị chiếm, connection pool cạn dần.

```java
// HIỆN TẠI — không có timeout
CompletableFuture.allOf(atsFuture, profileFuture).join();

// NÊN LÀ — timeout rõ ràng
CompletableFuture.allOf(atsFuture, profileFuture)
    .orTimeout(25, TimeUnit.SECONDS)   // Hard limit toàn bộ flow
    .join();
```

**Bổ sung thêm:** Timeout riêng per call để biết cái nào chậm:

```java
private CompletableFuture<String> callGeminiWithTimeout(String prompt, String callType) {
    int timeoutSeconds = switch(callType) {
        case "ats_analysis" -> 15;
        case "profile_extraction" -> 12;
        default -> 10;
    };
    return CompletableFuture
        .supplyAsync(() -> geminiClient.generate(prompt), executor)
        .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
        .exceptionally(e -> {
            log.error("Gemini {} timeout/error: {}", callType, e.getMessage());
            throw new GeminiCallException(callType, e);
        });
}
```

---

### 🟡 Vấn đề 4 — Response ~11 giây: vẫn blocking, cần cân nhắc async

**Vị trí:** Dòng cuối flow — `API -->> Candidate: HTTP 200 OK (~11 giây!)`

**Nhận xét:** Với CV Checker, 11 giây là đang hold HTTP connection từ đầu đến cuối. Đây là vấn đề ở nhiều cấp:
- Nginx/Gateway có thể timeout trước 11 giây nếu config ngắn
- Mobile client với mạng yếu dễ bị drop
- Không thể hiện progress cho user (đang ở bước nào?)
- Thread pool bị chiếm suốt 11 giây per request

**Hướng cải thiện — Job-based async + polling/WebSocket:**

```
POST /resumes/upload
→ Response ngay lập tức (< 100ms):
{
  "resumeId": "res_abc123",
  "status": "PROCESSING",
  "estimatedSeconds": 11
}

→ Client poll: GET /resumes/{id}/status
→ Hoặc WebSocket event: { type: "parse_complete", resumeId: "res_abc123" }
```

Nếu không muốn thay đổi nhiều, tối thiểu cần:
- Tăng timeout gateway lên 30s
- Trả về progress indicator: `parse_status` có thêm sub-state như `UPLOADING → EXTRACTING → ANALYZING → SAVING`

---

### 🟡 Vấn đề 5 — Không xử lý file không hợp lệ trước khi upload MinIO

**Vị trí:** Trước bước `uploadFile(file, "resumes/{userId}")`

**Vấn đề:** Luồng chưa có bước validate file trước khi upload lên storage. Nếu user upload file `.exe`, file rỗng, file >10MB, hoặc file PDF bị corrupt → hệ thống vẫn upload lên MinIO trước rồi mới fail ở bước parse → lãng phí bandwidth và storage.

**Validation cần có trước upload:**
```java
private void validateFile(MultipartFile file) {
    // 1. Size limit
    if (file.getSize() > MAX_CV_SIZE_BYTES) {  // Ví dụ 5MB
        throw new InvalidFileException("File quá lớn. Tối đa 5MB.");
    }

    // 2. MIME type — không tin vào extension, kiểm tra magic bytes
    String detectedMime = tika.detect(file.getInputStream());
    if (!ALLOWED_MIME_TYPES.contains(detectedMime)) {  // pdf, docx, doc
        throw new InvalidFileException("Chỉ chấp nhận PDF hoặc Word.");
    }

    // 3. Không rỗng
    if (file.isEmpty()) {
        throw new InvalidFileException("File không có nội dung.");
    }
}
```

---

## II. Vấn Đề Trong Database Schema

---

### 🔴 Vấn đề 6 — `Resume.parsed_data` (LONGTEXT): anti-pattern nghiêm trọng

**Bảng:** `Resume`

**Vấn đề:** Lưu toàn bộ raw JSON từ Gemini vào một cột LONGTEXT là một trong những anti-pattern phổ biến nhất:

- **Không thể query được:** Muốn tìm CV có `total_score > 80`? Phải load toàn bộ LONGTEXT rồi parse bằng code
- **Không có index:** Không thể đánh index JSON nesting sâu
- **Dữ liệu trùng lặp:** Dữ liệu đã được normalize vào `ScanScore`, `ScanSubScore` — lưu thêm raw JSON là duplication
- **Tăng kích thước row:** Ảnh hưởng hiệu năng scan table
- **Khó migrate:** Khi thay đổi Gemini prompt trả về format mới, field này chứa dữ liệu cũ lẫn mới không phân biệt được

**Hướng cải thiện:**

Nếu cần giữ raw output để debug/audit:
```sql
-- Tách ra bảng riêng, không load cùng Resume mặc định
CREATE TABLE resume_raw_ai_output (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  resume_id   BIGINT UNIQUE NOT NULL,
  ats_json    LONGTEXT,
  profile_json LONGTEXT,
  gemini_model VARCHAR(100),
  prompt_version VARCHAR(20),  -- để biết JSON thuộc schema prompt nào
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resume(id) ON DELETE CASCADE
);
```
Bảng `Resume` chính không còn `parsed_data` — query nhẹ hơn, join khi cần debug.

---

### 🔴 Vấn đề 7 — Thiếu `file_hash` unique constraint: dedup không hoạt động

**Bảng:** `ResumeScan` có `file_hash`, nhưng không thấy UNIQUE constraint

**Vấn đề:** Nếu `file_hash` không có unique index, race condition xảy ra khi 2 request cùng user upload cùng file đồng thời:

```
Request A: SELECT by hash → Not found
Request B: SELECT by hash → Not found
Request A: INSERT new record
Request B: INSERT new record  ← Tạo thêm 1 record trùng lặp
```

Kết quả: 2 records cho cùng 1 file, tốn 2 lần Gemini call.

**Fix:**
```sql
-- Dedup theo user + content (không phải file bytes)
ALTER TABLE resume
  ADD COLUMN content_hash VARCHAR(64) NOT NULL,
  ADD UNIQUE INDEX idx_resume_dedup (user_id, content_hash);

-- Application: dùng INSERT ... ON DUPLICATE KEY UPDATE hoặc SELECT FOR UPDATE
```

---

### 🟡 Vấn đề 8 — `ScanScore` là bảng 1-1 với `ResumeScan`: không cần thiết

**Bảng:** `ScanScore` — 1-1 với `ResumeScan`

**Vấn đề:** Bảng 1-1 chỉ có ý nghĩa khi:
- Một bên rất ít khi được query (lazy load)
- Cần tách access control
- Kích thước row quá lớn nếu merge

Trong trường hợp này, `ScanScore` chỉ có 5 cột số (`total_score`, `stage2_score`, `stage3_score`, `stage4_score`, `strengths`). Merge trực tiếp vào `ResumeScan` đơn giản hơn, giảm JOIN:

```sql
-- Sau khi merge vào ResumeScan
ALTER TABLE resume_scan
  ADD COLUMN total_score INT,
  ADD COLUMN stage2_score INT,
  ADD COLUMN stage3_score INT,
  ADD COLUMN stage4_score INT,
  ADD COLUMN strengths JSON;
```

Giảm từ 3 bảng (ResumeScan → ScanScore → ScanSubScore) xuống còn 2 bảng.

---

### 🟡 Vấn đề 9 — `ResumeProject.technologies` lưu dạng CSV string

**Bảng:** `ResumeProject`
```sql
technologies (VARCHAR): "Spring Boot, React, RabbitMQ, PostgreSQL"
```

**Vấn đề:**
- Không thể query `WHERE technologies LIKE '%React%'` mà tránh full scan
- Không thể join với bảng `ResumeSkill` để cross-reference
- Khi cần tìm "tất cả projects dùng React" → không có index, query cực kỳ chậm
- Dữ liệu không chuẩn hóa: "React" vs "ReactJS" vs "React.js" là 3 giá trị khác nhau

**Phương án 1 — JSON array (đơn giản, MySQL 5.7+):**
```sql
ALTER TABLE resume_project
  MODIFY technologies JSON;
-- Lưu: ["Spring Boot", "React", "RabbitMQ", "PostgreSQL"]
-- Query: JSON_CONTAINS(technologies, '"React"')
```

**Phương án 2 — Bảng junction (chuẩn hóa hoàn toàn, nếu cần search mạnh):**
```sql
CREATE TABLE resume_project_technology (
  project_id  BIGINT REFERENCES resume_project(id),
  skill_name  VARCHAR(100),
  PRIMARY KEY (project_id, skill_name)
);
CREATE INDEX idx_tech_name ON resume_project_technology(skill_name);
```

---

### 🟡 Vấn đề 10 — Thiếu `updated_at` trên tất cả bảng con

**Các bảng:** `ResumeBasicInfo`, `ResumeSkill`, `ResumeExperience`, `ResumeEducation`, v.v.

**Vấn đề:**
- Không theo dõi được khi nào data được update
- Không hỗ trợ incremental sync nếu cần export data
- Không có audit trail khi AI parse sai và cần re-process

**Fix đơn giản — thêm vào tất cả bảng:**
```sql
ALTER TABLE resume_basic_info
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
-- Tương tự cho tất cả bảng con
```

---

### 🟡 Vấn đề 11 — `ScanSubScore.lost_points` là computed column: lưu trữ dư thừa

**Bảng:** `ScanSubScore`
```sql
lost_points (INT): max_score - score  ← luôn luôn bằng max_score - score
```

**Vấn đề:** `lost_points` là derived value, không bao giờ có thông tin độc lập. Lưu vào DB tạo ra:
- Risk dữ liệu không nhất quán: nếu `score` bị update mà không update `lost_points` → 2 cột mâu thuẫn nhau
- Lãng phí storage không đáng kể nhưng là bad practice

**Fix:**
```sql
-- Xóa cột lost_points
ALTER TABLE scan_sub_score DROP COLUMN lost_points;

-- Tính ở application layer hoặc dùng generated column (MySQL 5.7+)
ALTER TABLE scan_sub_score
  ADD COLUMN lost_points INT GENERATED ALWAYS AS (max_score - score) STORED;
```

---

### 🟡 Vấn đề 12 — `ScanAction.priority` lưu string tiếng Việt

**Bảng:** `ScanAction`
```sql
priority (VARCHAR): "Cao" / "Trung bình" / "Thấp"
```

**Vấn đề:**
- Hardcode ngôn ngữ vào DB — khó thêm ngôn ngữ khác sau này
- Sort theo priority không đúng thứ tự: alphabetical `"Cao" < "Thấp" < "Trung bình"` — không đúng logic
- Spelling mismatch nếu Gemini đôi khi trả về "Cao" vs "cao" (case sensitive)

**Fix:**
```sql
-- Dùng ENUM có thứ tự số
ALTER TABLE scan_action
  MODIFY priority ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM';

-- Sort đúng thứ tự: ORDER BY FIELD(priority, 'HIGH', 'MEDIUM', 'LOW')
-- Hoặc thêm cột priority_order để sort đơn giản hơn
ALTER TABLE scan_action ADD COLUMN priority_order TINYINT
  GENERATED ALWAYS AS (
    CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END
  ) STORED;
```
Mapping sang ngôn ngữ hiển thị xử lý ở frontend/i18n layer.

---

### 🟣 Vấn đề 13 — Thiếu index cho các query path phổ biến

**Toàn bộ schema**

Nhìn vào luồng sử dụng thực tế, các query thường gặp:

```sql
-- Query 1: Lấy lịch sử quét của user
SELECT * FROM resume_scan WHERE user_id = ? ORDER BY scanned_at DESC;
-- Cần: INDEX(user_id, scanned_at DESC)

-- Query 2: Tìm CV theo hash (dedup check)
SELECT * FROM resume WHERE user_id = ? AND content_hash = ?;
-- Cần: UNIQUE INDEX(user_id, content_hash)

-- Query 3: Lấy tất cả sub-scores của một lần quét
SELECT * FROM scan_sub_score WHERE scan_id = ?;
-- Cần: INDEX(scan_id)  ← thường tự có qua FK nhưng cần kiểm tra

-- Query 4: Employer tìm kiếm CV theo skill
SELECT r.* FROM resume_skill rs
JOIN resume r ON r.id = rs.resume_id
WHERE rs.skill_name = 'Java' AND rs.proficiency_level = 'ADVANCED';
-- Cần: INDEX(skill_name, proficiency_level)
```

**Migration bổ sung index:**
```sql
CREATE INDEX idx_resume_scan_user ON resume_scan(user_id, scanned_at DESC);
CREATE INDEX idx_scan_sub_score_scan ON scan_sub_score(scan_id);
CREATE INDEX idx_resume_skill_name ON resume_skill(skill_name, proficiency_level);
CREATE INDEX idx_resume_experience_resume ON resume_experience(resume_id, display_order);
```

---

### 🟣 Vấn đề 14 — Không có versioning cho Gemini prompt/model

**Bảng:** `ResumeScan`, `Resume`

**Vấn đề:** Khi nâng cấp Gemini model (Flash Lite → Flash → Pro) hoặc thay đổi prompt structure, dữ liệu cũ và mới sẽ được tổng hợp lẫn lộn trong cùng bảng. Không biết record nào được parse bằng prompt version nào.

**Hệ quả:**
- Không thể A/B test chất lượng parse giữa các prompt version
- Không thể re-process batch các CV cũ bằng prompt mới
- Khi báo cáo phân tích chất lượng AI, không phân biệt được data set

**Hướng cải thiện:**
```sql
ALTER TABLE resume_scan
  ADD COLUMN ai_model VARCHAR(50) DEFAULT 'gemini-2.0-flash-lite',
  ADD COLUMN prompt_version VARCHAR(20) DEFAULT 'v1.0';

-- Khi nâng cấp prompt → tăng prompt_version
-- Cronjob re-process: SELECT * FROM resume WHERE prompt_version < 'v2.0' LIMIT 100
```

---

## III. Vấn Đề Trong Cấu Trúc JSON (Phụ Lục)

---

### 🟡 Vấn đề 15 — JSON ATS trả về `details` là array string: khó parse ổn định

**JSON response Gemini lần 1:**
```json
"ats_format": {
  "details": [
    "File định dạng PDF chuẩn +10/10",
    "Dữ liệu dạng bảng phức tạp ảnh hưởng máy đọc +8/10"
  ]
}
```

**Vấn đề:** Điểm số được nhúng trong free-text string (`+8/10`). Để lấy điểm số cần regex parse string — rất dễ fail khi Gemini đổi format output:
- `"+8/10"` vs `"8/10"` vs `"đạt 8 điểm"` → 3 format khác nhau, regex phải cover hết

**Hướng cải thiện — Yêu cầu Gemini trả về structured JSON cho từng sub-criteria:**

```json
"ats_format": {
  "sub_scores": [
    { "key": "file_technical",  "score": 10, "max": 10, "detail": "File PDF chuẩn, không có bảng phức tạp" },
    { "key": "ats_parsability", "score": 8,  "max": 10, "detail": "Dữ liệu dạng bảng ảnh hưởng máy đọc" },
    { "key": "typography",      "score": 10, "max": 10, "detail": "Phông chữ Serif chuẩn" },
    { "key": "length",          "score": 10, "max": 10, "detail": "Độ dài 1 trang phù hợp" }
  ]
}
```

Prompt thêm instruction: *"Return ONLY valid JSON. Each sub-score must have: key (string), score (integer), max (integer), detail (string). No free-text embedding of scores."*

---

### 🟡 Vấn đề 16 — `sub_tips` chỉ có 3 key trong JSON mẫu: thiếu 20 key còn lại

**JSON response:**
```json
"sub_tips": {
  "file_technical": "...",
  "quantification": "...",
  "contact": "..."
}
```

**Vấn đề:** Hệ thống có 23 tiêu chí nhưng JSON mẫu chỉ thấy 3 tip. Nếu prompt không ràng buộc đủ chặt, Gemini sẽ tự ý bỏ qua các tiêu chí điểm cao (không cần tip). Kết quả là `ScanSubScore.tip` của nhiều tiêu chí sẽ là NULL — frontend không hiển thị được tip.

**Fix trong prompt:**
```
Bắt buộc trả về tip cho tất cả 23 section_key sau:
[file_technical, ats_parsability, typography, length, contact, summary, sections,
 organization, language, quantification, keywords, consistency, progression,
 bullet_quality, scope_impact, technical_evidence, projects, certs,
 leadership, international, awards, learning, category_specific]

Nếu tiêu chí đạt điểm tuyệt đối, tip = "Duy trì tốt phần này."
```

---

## IV. Lộ Trình Cải Thiện

### Sprint 1 — Fix lỗi nghiêm trọng (3–5 ngày)

- [ ] **Vấn đề 1**: Sửa cache logic — hash theo `content` + filter `user_id`, tránh cross-user cache hit
- [ ] **Vấn đề 2**: Thêm checkpoint save theo từng bước, xử lý lỗi từng stage riêng biệt
- [ ] **Vấn đề 3**: Thêm `.orTimeout()` cho CompletableFuture, circuit breaker cho Gemini calls
- [ ] **Vấn đề 5**: Validate file trước khi upload MinIO (size, MIME type, empty check)

### Sprint 2 — Cải thiện Schema (3–4 ngày)

- [ ] **Vấn đề 6**: Tách `parsed_data` ra bảng `resume_raw_ai_output` riêng
- [ ] **Vấn đề 7**: Thêm UNIQUE constraint `(user_id, content_hash)` chống race condition
- [ ] **Vấn đề 9**: Đổi `technologies` từ CSV string sang JSON array
- [ ] **Vấn đề 12**: Đổi `priority` sang ENUM chuẩn hóa (HIGH/MEDIUM/LOW)
- [ ] **Vấn đề 13**: Bổ sung index cho các query path phổ biến

### Sprint 3 — Nâng cao chất lượng (tuỳ ưu tiên)

- [ ] **Vấn đề 4**: Chuyển CV Checker sang async job + polling/WebSocket
- [ ] **Vấn đề 8**: Merge `ScanScore` vào `ResumeScan` bỏ bảng 1-1 không cần thiết
- [ ] **Vấn đề 10**: Thêm `created_at`, `updated_at` vào tất cả bảng con
- [ ] **Vấn đề 11**: Chuyển `lost_points` sang computed/generated column
- [ ] **Vấn đề 14**: Thêm `ai_model` và `prompt_version` vào `ResumeScan`
- [ ] **Vấn đề 15**: Refactor Gemini prompt → structured sub-score JSON
- [ ] **Vấn đề 16**: Ràng buộc prompt trả đủ 23 tips

---

## V. Tóm Tắt Đánh Giá

| Hạng mục | Điểm hiện tại | Sau khi fix |
|---|---|---|
| Độ bền luồng xử lý | 5/10 — Không có fallback, checkpoint | 8/10 |
| Tính đúng đắn của cache | 4/10 — Cross-user risk, race condition | 9/10 |
| Chất lượng schema | 6/10 — Một số anti-pattern | 8.5/10 |
| Khả năng debug/audit | 4/10 — Thiếu versioning, timestamp | 8/10 |
| Khả năng mở rộng | 6/10 — Thiếu index, CSV trong cột | 8/10 |
| **Tổng thể** | **5/10** | **8.5/10** |

> **Nhận xét chung:** Đây là thiết kế của một developer có tư duy hệ thống tốt — parallel processing, hash dedup, tách schema đúng use case. Các vấn đề chủ yếu nằm ở lớp _robustness_ (xử lý lỗi, race condition) và một số _schema detail_ (computed column, CSV string, missing index) — những thứ thường chỉ lộ ra khi hệ thống bắt đầu có tải thật hoặc dữ liệu thật.
