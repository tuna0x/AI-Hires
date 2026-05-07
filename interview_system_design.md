# Thiết kế Hệ thống Interview — CV-based + JD + Question Bank

## Tổng quan vấn đề

Hệ thống cần giải quyết đồng thời 3 nguồn câu hỏi khác nhau:

| Nguồn | Ví dụ | Tái sử dụng? |
|---|---|---|
| **Bank** | "Giải thích REST API là gì?" | ✅ Nhiều user |
| **CV-based** | "Bạn đề cập dùng Elasticsearch ở ABC Corp, hãy nói về..." | ❌ Gắn 1 CV cụ thể |
| **JD-based** | "JD yêu cầu kinh nghiệm Kubernetes, bạn có kinh nghiệm không?" | ⚠️ Gắn 1 JD, có thể reuse |

Vấn đề cốt lõi: **Nếu gộp chung 1 bảng**, không phân biệt được câu nào generic / câu nào phải hỏi theo CV → AI sinh câu hỏi thiếu cá nhân hóa, user không chỉnh sửa được theo công ty.

---

## Kiến trúc giải pháp — 3 tầng câu hỏi

```
┌─────────────────────────────────────────────────────────┐
│  Tầng 1: question_bank       (Generic, tái sử dụng)     │
│  Tầng 2: cv_questions        (Cá nhân hóa theo CV/JD)   │
│  Tầng 3: session_questions   (Mix 2 tầng trên/session)  │
└─────────────────────────────────────────────────────────┘
```

Luồng chính:

```
User upload CV + (optional) JD
        ↓
AI sinh 2 batch câu hỏi song song:
  ├── Batch A: CV-based questions  → lưu cv_questions
  └── Batch B: JD-based questions  → lưu cv_questions (jd_id != null)
        ↓
Backend lookup question_bank theo role + difficulty
        ↓
Merge & deduplicate → session_questions
        ↓
User có thể chỉnh sửa / thêm / xóa câu hỏi
        ↓
Bắt đầu mock interview
```

---

## Schema chi tiết

### Bảng 1 — `question_bank` (Generic questions)

```sql
CREATE TABLE question_bank (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    content         TEXT NOT NULL,
    type            ENUM('Technical','Behavioral','Situational') NOT NULL,
    difficulty      ENUM('Easy','Medium','Hard') NOT NULL,
    role            VARCHAR(50),        -- 'Backend', 'Frontend', 'DevOps'...
    industry        VARCHAR(50),        -- 'IT', 'Finance', 'Marketing'...
    sample_answer   TEXT,               -- Câu trả lời mẫu (nullable)
    source          ENUM('AI_GENERATED','MANUAL','JD_PARSED','PROMOTED') NOT NULL,
    use_count       INT DEFAULT 0,      -- Đếm số lần dùng → ranking
    avg_score       FLOAT DEFAULT NULL, -- Điểm trung bình user trả lời → độ khó thực tế
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_type_difficulty (type, difficulty),
    INDEX idx_role (role),
    INDEX idx_industry (industry)
);
```

**Lưu ý thiết kế:**
- `use_count` + `avg_score` giúp system tự học: câu nào nhiều người trả lời sai → tăng độ khó thực tế
- `source = PROMOTED` khi được promote từ `cv_questions`
- Không lưu `cv_context` ở đây — đây là câu hỏi generic, không gắn CV cụ thể nào

---

### Bảng 2 — `question_tags` (Gắn tag kỹ thuật)

```sql
CREATE TABLE question_tags (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id     BIGINT NOT NULL,
    tag             VARCHAR(50) NOT NULL,  -- 'React', 'NodeJS', 'AWS', 'SQL'...
    
    FOREIGN KEY (question_id) REFERENCES question_bank(id),
    INDEX idx_tag (tag),
    UNIQUE KEY uq_question_tag (question_id, tag)
);
```

**Tại sao tách bảng tags thay vì JSON column?**
Vì cần query: *"Lấy câu hỏi về React + Difficulty=Medium"* → phải index được, JSON column không làm được hiệu quả.

---

### Bảng 3 — `cv_questions` (CV/JD-based questions)

```sql
CREATE TABLE cv_questions (
    id                    BIGINT PRIMARY KEY AUTO_INCREMENT,
    scan_id               BIGINT NOT NULL,       -- FK → resume_scans
    jd_id                 BIGINT,                -- FK → job_descriptions (nullable)
    content               TEXT NOT NULL,
    type                  ENUM('Technical','Behavioral','Situational') NOT NULL,
    difficulty            ENUM('Easy','Medium','Hard') NOT NULL,

    -- Điểm khác biệt quan trọng nhất so với question_bank
    cv_context            TEXT,
    -- Lưu đoạn CV liên quan, ví dụ:
    -- "Ứng viên ghi: 'Tối ưu Elasticsearch giảm 40% latency tại ABC Corp'"
    -- AI dùng context này để sinh câu hỏi chính xác, đúng thực tế của ứng viên

    jd_context            TEXT,
    -- Lưu đoạn JD liên quan, ví dụ:
    -- "JD yêu cầu: '3+ years experience with Kubernetes and container orchestration'"

    -- Promote flow: CV question → Bank question
    can_reuse             BOOLEAN DEFAULT FALSE,
    -- true khi câu hỏi có thể tái sử dụng (sau khi bỏ cv_context)
    -- Ví dụ: "Bạn đã xử lý race condition như thế nào?" → có thể reuse
    -- Ngược lại: "Tại ABC Corp bạn đã làm gì?" → không thể reuse

    promoted_to_bank_id   BIGINT,
    -- FK → question_bank.id (nullable)
    -- Khi can_reuse=true và đã được promote

    is_customized         BOOLEAN DEFAULT FALSE,
    -- true khi user đã chỉnh sửa câu hỏi này

    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (scan_id) REFERENCES resume_scans(id),
    INDEX idx_scan_id (scan_id),
    INDEX idx_jd_id (jd_id)
);
```

**cv_context quan trọng như thế nào?**

Không có `cv_context`:
> AI hỏi: *"Bạn có kinh nghiệm với Elasticsearch không?"* → Câu hỏi chung chung

Có `cv_context = "Tối ưu Elasticsearch giảm 40% latency tại ABC Corp"`:
> AI hỏi: *"Bạn đề cập giảm 40% latency với Elasticsearch — cụ thể bạn đã làm gì, và bottleneck lớn nhất bạn gặp phải là gì?"* → Câu hỏi sâu, cá nhân hóa

---

### Bảng 4 — `interview_sessions`

```sql
CREATE TABLE interview_sessions (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    scan_id         BIGINT,                     -- nullable: có thể interview không cần CV
    jd_id           BIGINT,                     -- nullable: có thể không có JD
    company_name    VARCHAR(255),               -- Tên công ty user muốn apply
    target_role     VARCHAR(100),               -- Vị trí ứng tuyển
    total_score     TINYINT,                    -- Điểm tổng buổi interview (0–100)
    status          ENUM('PREPARING','ONGOING','COMPLETED','ABANDONED') DEFAULT 'PREPARING',
    config          JSON,
    -- Lưu cấu hình buổi interview:
    -- {"num_questions": 10, "time_per_question": 120,
    --  "types": ["Technical","Behavioral"], "difficulty": "Medium"}
    started_at      TIMESTAMP,
    ended_at        TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_scan_id (scan_id)
);
```

---

### Bảng 5 — `session_questions` (Pivot — mix bank + cv questions)

```sql
CREATE TABLE session_questions (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id          BIGINT NOT NULL,
    bank_question_id    BIGINT,     -- FK → question_bank (nullable)
    cv_question_id      BIGINT,     -- FK → cv_questions  (nullable)
    -- Constraint: đúng 1 trong 2 phải có giá trị
    sort_order          TINYINT NOT NULL,
    is_skipped          BOOLEAN DEFAULT FALSE,
    is_customized       BOOLEAN DEFAULT FALSE,  -- User đã sửa câu hỏi này chưa
    custom_content      TEXT,                   -- Nội dung sau khi user chỉnh sửa

    FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
    FOREIGN KEY (bank_question_id) REFERENCES question_bank(id),
    FOREIGN KEY (cv_question_id) REFERENCES cv_questions(id),

    -- Đảm bảo đúng 1 nguồn câu hỏi
    CONSTRAINT chk_question_source CHECK (
        (bank_question_id IS NOT NULL AND cv_question_id IS NULL) OR
        (bank_question_id IS NULL     AND cv_question_id IS NOT NULL)
    )
);
```

---

### Bảng 6 — `interview_answers`

```sql
CREATE TABLE interview_answers (
    id                      BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_question_id     BIGINT NOT NULL,
    answer_text             TEXT NOT NULL,
    score                   TINYINT,            -- Điểm tổng câu này (0–10)
    ai_feedback             TEXT,               -- Nhận xét tổng thể của AI
    answered_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_question_id) REFERENCES session_questions(id)
);
```

---

### Bảng 7 — `answer_scores` (Chấm điểm chi tiết theo tiêu chí)

```sql
CREATE TABLE answer_scores (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    answer_id   BIGINT NOT NULL,
    criteria    ENUM('Relevance','Depth','Structure','Communication') NOT NULL,
    score       TINYINT NOT NULL,   -- 0–10 mỗi tiêu chí
    comment     TEXT,               -- AI giải thích tại sao cho điểm này

    FOREIGN KEY (answer_id) REFERENCES interview_answers(id),
    UNIQUE KEY uq_answer_criteria (answer_id, criteria)
);
```

**Tại sao tách `answer_scores` thay vì JSON?**

Vì cần query: *"User này yếu tiêu chí nào nhất qua tất cả các buổi?"*

```sql
SELECT criteria, AVG(score) as avg_score
FROM answer_scores ans
JOIN interview_answers ia ON ia.id = ans.answer_id
JOIN session_questions sq ON sq.id = ia.session_question_id
JOIN interview_sessions s ON s.id = sq.session_id
WHERE s.user_id = ?
GROUP BY criteria
ORDER BY avg_score ASC;
-- → "Communication: 4.2, Depth: 5.1, Structure: 6.3, Relevance: 7.8"
-- → User biết rõ cần luyện giao tiếp nhiều hơn
```

---

## Luồng AI sinh câu hỏi — Giải quyết vấn đề mix 3 nguồn

### Prompt strategy — Tách làm 2 lần gọi AI

**Vấn đề nếu gộp 1 prompt:** AI sinh lẫn lộn câu generic với câu CV-specific → khó phân loại để lưu đúng bảng.

**Giải pháp: 2 lần gọi song song (CompletableFuture)**

```java
public InterviewQuestionSet generateQuestions(
        byte[] cvBytes, String jdText, String role, int numQuestions) {

    // Gọi song song 2 loại câu hỏi
    CompletableFuture<List<CvQuestion>> cvFuture =
        CompletableFuture.supplyAsync(() -> generateCvBasedQuestions(cvBytes, jdText));

    CompletableFuture<List<BankQuestion>> bankFuture =
        CompletableFuture.supplyAsync(() -> fetchFromBank(role, numQuestions / 2));

    // Merge kết quả
    List<CvQuestion> cvQuestions = cvFuture.join();     // ~4–5 câu cá nhân hóa
    List<BankQuestion> bankQuestions = bankFuture.join(); // ~5–6 câu generic

    return mergeAndDeduplicate(cvQuestions, bankQuestions);
}
```

---

### Prompt 1 — Sinh CV/JD-based questions

```java
String cvPrompt =
    "Bạn là interviewer chuyên nghiệp. Đọc CV và JD đính kèm.\n" +
    "Sinh ra ĐÚNG " + numCvQuestions + " câu hỏi phỏng vấn CÁ NHÂN HÓA.\n\n" +

    "NGUYÊN TẮC QUAN TRỌNG:\n" +
    "- Mỗi câu hỏi PHẢI dựa trên thông tin CỤ THỂ trong CV (tên công ty, con số, công nghệ thực tế)\n" +
    "- KHÔNG sinh câu hỏi chung chung như 'Bạn có kinh nghiệm với Java không?'\n" +
    "- Câu hỏi phải đào sâu vào trải nghiệm thực tế: 'Tại X bạn đạt Y, cụ thể bạn đã làm gì?'\n\n" +

    "Trả về JSON array, mỗi item:\n" +
    "{\n" +
    "  \"content\": \"<Nội dung câu hỏi>\",\n" +
    "  \"type\": \"Technical|Behavioral|Situational\",\n" +
    "  \"difficulty\": \"Easy|Medium|Hard\",\n" +
    "  \"cv_context\": \"<Đoạn CV liên quan — copy nguyên văn từ CV>\",\n" +
    "  \"jd_context\": \"<Đoạn JD liên quan nếu có, null nếu không>\",\n" +
    "  \"can_reuse\": <true nếu câu hỏi không đề cập tên công ty/số liệu cụ thể, false nếu ngược lại>\n" +
    "}";
```

---

### Prompt 2 — Không cần gọi AI, query thẳng từ bank

```java
List<BankQuestion> fetchFromBank(String role, int limit) {
    // Query có trọng số: ưu tiên câu chưa dùng nhiều + phù hợp role
    return questionBankRepo.findByRoleAndActive(role, limit,
        Sort.by("use_count").ascending()  // Câu ít dùng → ưu tiên hơn
    );
}
```

---

### Merge & Deduplicate

```java
InterviewQuestionSet mergeAndDeduplicate(
        List<CvQuestion> cvQs, List<BankQuestion> bankQs) {

    // Dùng embedding similarity để phát hiện câu trùng ý
    // Đơn giản hơn: so sánh keyword overlap > 60% thì bỏ bank question
    List<BankQuestion> filtered = bankQs.stream()
        .filter(bq -> cvQs.stream()
            .noneMatch(cq -> keywordOverlap(bq.content, cq.content) > 0.6))
        .collect(toList());

    // Mix: xen kẽ CV question và Bank question
    // [CV, Bank, CV, Bank, CV, Bank, Bank, Bank, Bank, Bank]
    // Câu CV đầu tiên để tạo cảm giác cá nhân hóa ngay từ đầu
    return interleave(cvQs, filtered);
}
```

---

## Luồng User chỉnh sửa câu hỏi theo công ty

Sau khi AI sinh xong, user có thể:

```
1. Xem danh sách câu hỏi đã được sinh
2. Chỉnh sửa nội dung câu hỏi (lưu vào session_questions.custom_content)
3. Thêm câu hỏi mới (tạo thêm row cv_questions với is_customized=true)
4. Xóa câu hỏi không phù hợp (đánh dấu is_skipped=true)
5. Lưu bộ câu hỏi theo công ty (lưu vào interview_templates — bảng mở rộng)
```

### Bảng mở rộng — `interview_templates` (Tùy chỉnh theo công ty)

```sql
CREATE TABLE interview_templates (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    company_name    VARCHAR(255),       -- 'Google', 'VNG', 'Tiki'...
    role            VARCHAR(100),
    name            VARCHAR(255),       -- 'Template Google SWE L4'
    question_ids    JSON,
    -- Lưu mixed array:
    -- [{"type":"bank","id":123}, {"type":"cv","id":456}, ...]
    -- Khi dùng lại: clone ra session_questions mới
    is_public       BOOLEAN DEFAULT FALSE,  -- Chia sẻ với community
    use_count       INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Tóm tắt — Phân chia trách nhiệm rõ ràng

| Bảng | Trách nhiệm | Query chính |
|---|---|---|
| `question_bank` | Kho câu hỏi generic, tái sử dụng | Lọc theo role/type/difficulty |
| `question_tags` | Tags kỹ thuật chi tiết | Tìm theo công nghệ cụ thể |
| `cv_questions` | Câu hỏi cá nhân hóa từ CV/JD | Lookup theo scan_id |
| `interview_sessions` | 1 buổi phỏng vấn | Lịch sử theo user |
| `session_questions` | Mix câu hỏi trong 1 buổi | Pivot bank + cv |
| `interview_answers` | Câu trả lời + AI feedback | Xem lại lịch sử |
| `answer_scores` | Điểm chi tiết 4 tiêu chí | Phân tích điểm yếu user |
| `interview_templates` | Bộ câu hỏi tùy chỉnh theo công ty | Clone cho session mới |

---

## Promote Flow — CV Question → Bank Question

Khi 1 câu hỏi CV-based có `can_reuse = true` và đã được nhiều user dùng:

```java
void promoteToBank(Long cvQuestionId) {
    CvQuestion cvQ = cvQuestionRepo.findById(cvQuestionId);

    // Strip cv_context, giữ core question
    BankQuestion bankQ = BankQuestion.builder()
        .content(stripCvSpecificInfo(cvQ.content))
        // "Tại ABC Corp bạn đạt 40% latency reduction với ES, cụ thể bạn làm gì?"
        // → "Bạn đã tối ưu Elasticsearch như thế nào để giảm latency?"
        .type(cvQ.type)
        .difficulty(cvQ.difficulty)
        .source(Source.PROMOTED)
        .build();

    bankQ = questionBankRepo.save(bankQ);

    // Cập nhật reference
    cvQ.setPromotedToBankId(bankQ.getId());
    cvQuestionRepo.save(cvQ);
}
```

---

## Redis Cache Strategy cho Interview

```
Key: interview:session:{sessionId}:questions
Value: JSON array toàn bộ session_questions + content
TTL: 2 giờ (trong buổi interview)

Key: interview:bank:{role}:{difficulty}
Value: JSON array top 50 bank questions
TTL: 24 giờ (ít thay đổi)

Key: interview:cv:{scanId}:questions
Value: JSON array cv_questions của scan này
TTL: 7 ngày (user có thể dùng lại)
```

Khi bắt đầu session: load từ cache → không query DB trong lúc interview đang diễn ra → latency thấp nhất.
