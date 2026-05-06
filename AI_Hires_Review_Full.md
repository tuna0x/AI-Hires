# 📘 AI-Hires — Review Toàn Diện: Database & Kế Hoạch Cải Tiến

> Tài liệu này phân tích chi tiết thiết kế cơ sở dữ liệu hiện tại, giải thích từng thành phần, chỉ ra các vấn đề còn tồn tại và đề xuất hướng cải tiến — **dành cho người đọc hiểu, không phải để code ngay.**

---

## MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc Database Hiện Tại](#2-kiến-trúc-database-hiện-tại)
3. [Phân Hệ 1 — CV Parsing (Bóc Tách CV)](#3-phân-hệ-1--cv-parsing-bóc-tách-cv)
4. [Phân Hệ 2 — CV Scoring (Chấm Điểm CV)](#4-phân-hệ-2--cv-scoring-chấm-điểm-cv)
5. [Phân Hệ 3 — AI Interview (Phỏng Vấn AI)](#5-phân-hệ-3--ai-interview-phỏng-vấn-ai)
6. [Những Điểm Mạnh Của Thiết Kế Hiện Tại](#6-những-điểm-mạnh-của-thiết-kế-hiện-tại)
7. [Các Vấn Đề Cần Cải Tiến](#7-các-vấn-đề-cần-cải-tiến)
8. [Kế Hoạch Cải Tiến Chi Tiết](#8-kế-hoạch-cải-tiến-chi-tiết)
9. [Thứ Tự Ưu Tiên Thực Hiện](#9-thứ-tự-ưu-tiên-thực-hiện)

---

## 1. Tổng Quan Hệ Thống

**AI-Hires** là hệ thống tuyển dụng thông minh gồm 2 chức năng cốt lõi:

- **CV Parsing & Scoring**: Tự động đọc file CV, bóc tách thông tin (tên, kỹ năng, kinh nghiệm...) và chấm điểm mức độ phù hợp với vị trí tuyển dụng bằng AI (Google Gemini).
- **AI Interview**: Tổ chức phỏng vấn trực tuyến tự động, AI đặt câu hỏi → ứng viên trả lời → AI chấm điểm từng câu → tổng hợp báo cáo.

**Công nghệ sử dụng:**
- Backend: Java Spring Boot + JPA/Hibernate
- AI: Google Gemini API
- Message Queue: RabbitMQ (xử lý bất đồng bộ)
- Database: MySQL (3NF — chuẩn hóa quan hệ)

---

## 2. Kiến Trúc Database Hiện Tại

### Sơ đồ quan hệ tổng thể (ERD)

```
USERS
  └──(1:N)──► RESUMES
                ├──(1:1)──► RESUME_BASIC_INFO       (thông tin cá nhân)
                ├──(1:N)──► RESUME_SKILLS            (kỹ năng)
                ├──(1:N)──► RESUME_EXPERIENCES       (kinh nghiệm)
                ├──(1:N)──► RESUME_EDUCATIONS        (học vấn)
                ├──(1:N)──► RESUME_CERTIFICATIONS    (chứng chỉ)
                ├──(1:N)──► RESUME_PROJECTS          (dự án)
                └──(1:N)──► RESUME_LANGUAGES         (ngoại ngữ)

APPLICATIONS
  ├──(1:1)──► CV_SCORES                              (điểm CV)
  │              ├──(1:N)──► SCORE_DETAILS           (chi tiết từng tiêu chí)
  │              │              └──(N:1)──► SCORING_RULES
  │
  └──(1:N)──► INTERVIEW_SESSIONS                     (phiên phỏng vấn)
                 ├──(1:N)──► INTERVIEW_QUESTIONS     (câu hỏi)
                 │              └──(1:1)──► INTERVIEW_ANSWERS     (câu trả lời)
                 │                            └──(1:1)──► INTERVIEW_EVALUATIONS (đánh giá)
                 └──(1:1)──► INTERVIEW_REPORTS       (báo cáo tổng kết)
```

### Nguyên tắc thiết kế đã áp dụng

**Chuẩn hóa 3NF (Third Normal Form)** — đây là lựa chọn đúng đắn. Thay vì lưu toàn bộ CV dưới dạng một khối JSON lớn (như nhiều hệ thống làm), AI-Hires tách từng phần thông tin ra bảng riêng. Điều này cho phép:
- Truy vấn linh hoạt: "Tìm tất cả ứng viên có kỹ năng Java"
- Lọc và so sánh: "Ứng viên nào có GPA > 3.5 và kinh nghiệm > 2 năm"
- Thống kê: "Kỹ năng phổ biến nhất trong các CV nộp tháng này"

---

## 3. Phân Hệ 1 — CV Parsing (Bóc Tách CV)

Đây là nhóm bảng lưu trữ thông tin được trích xuất từ file CV gốc của ứng viên.

---

### 3.1 Bảng `resumes` (CV gốc)

Bảng trung tâm của phân hệ này. Mỗi dòng là một file CV mà ứng viên tải lên.

| Vai trò | Giải thích |
|---|---|
| **Trục liên kết** | Tất cả bảng khác (skills, experiences...) đều trỏ về đây qua `resume_id` |
| **Metadata file** | Lưu thông tin về file: tên, đường dẫn, ngày upload |
| **Trạng thái xử lý** | Theo dõi CV đang ở bước nào: đang phân tích, đã xong, lỗi |

**Điểm cần lưu ý:** Bảng này chưa có cột `deleted_at` (soft delete) — nếu xóa CV, dữ liệu mất vĩnh viễn, không khôi phục được.

---

### 3.2 Bảng `resume_basic_info` (Thông tin cá nhân)

Quan hệ **1:1** với `resumes` — mỗi CV chỉ có đúng một bộ thông tin cá nhân.

| Cột quan trọng | Ý nghĩa | Lưu ý |
|---|---|---|
| `full_name` | Họ tên ứng viên | Trích xuất từ CV |
| `email`, `phone` | Thông tin liên hệ | **Dữ liệu nhạy cảm — cần mã hóa** |
| `address` | Địa chỉ | **Dữ liệu nhạy cảm — cần mã hóa** |
| `predicted_level` | AI dự đoán cấp độ | `INTERN / FRESHER / JUNIOR / MIDDLE / SENIOR` |
| `predicted_industry` | AI nhận diện ngành nghề | Dựa trên toàn bộ nội dung CV |
| `objective` | Mục tiêu nghề nghiệp | Đoạn giới thiệu bản thân |

**Vấn đề bảo mật:** `email`, `phone`, `address` đang lưu dạng **plain text**. Nếu database bị tấn công, toàn bộ thông tin cá nhân ứng viên bị lộ. Đây là vi phạm GDPR nghiêm trọng.

---

### 3.3 Bảng `resume_skills` (Kỹ năng)

Quan hệ **N:1** với `resumes` — một CV có nhiều kỹ năng.

| Cột | Ý nghĩa | Ví dụ giá trị |
|---|---|---|
| `skill_name` | Tên kỹ năng | `Java`, `Spring Boot`, `React` |
| `category` | Loại kỹ năng | `TECHNICAL`, `SOFT`, `LANGUAGE`, `TOOL` |
| `proficiency_level` | Mức thành thạo | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT` |
| `years_of_experience` | Số năm dùng kỹ năng này | `3.5` (năm) |

**Tại sao tách ra bảng riêng thay vì lưu `"Java, Python, React"` trong một cột?**
Vì nếu lưu gộp, bạn không thể query: `WHERE skill_name = 'Java'`. Bạn chỉ có thể làm `LIKE '%Java%'`, vừa chậm vừa không chính xác (sẽ match cả "JavaScript").

---

### 3.4 Bảng `resume_experiences` (Kinh nghiệm làm việc)

Mỗi vị trí công việc là một dòng riêng.

| Cột | Ý nghĩa | Lưu ý thiết kế |
|---|---|---|
| `company_name` | Tên công ty | |
| `position` | Chức danh | VD: "Senior Backend Developer" |
| `start_date` / `end_date` | Thời gian làm việc | Từ đây tính được số năm kinh nghiệm |
| `is_current` | Đang làm ở đây không | Nếu `true`, `end_date` có thể null |
| `description` | Mô tả công việc | |
| `achievements` | Thành tựu nổi bật | Tách riêng khỏi description — rất đúng |
| `display_order` | Thứ tự hiển thị | Để sắp xếp theo thời gian giảm dần |

**Thiết kế tốt:** Tách `achievements` riêng thay vì gộp vào `description` giúp AI có thể đánh giá thành tựu riêng biệt, chứ không phải đọc toàn bộ đoạn văn.

---

### 3.5 Bảng `resume_educations` (Học vấn)

| Cột | Ý nghĩa |
|---|---|
| `institution_name` | Tên trường |
| `degree` | Bằng cấp (Cử nhân, Thạc sĩ...) |
| `field_of_study` | Ngành học |
| `gpa` | Điểm trung bình |

**Lưu ý:** Kiểu dữ liệu `DOUBLE` cho `gpa` có thể gây lỗi floating-point nhỏ (0.1 + 0.2 = 0.30000000000000004). Nên dùng `DECIMAL(3,2)` để chính xác tuyệt đối.

---

### 3.6 Các bảng phụ trợ

**`resume_certifications`** — Chứng chỉ: AWS, OCP, PMP...
- Có `expiry_date` để biết chứng chỉ còn hiệu lực không
- Có `credential_url` để xác thực online

**`resume_projects`** — Dự án cá nhân/thực tế
- Cột `technologies` lưu dưới dạng `TEXT` — đây là điểm yếu nhỏ, không thể query "dự án dùng React"

**`resume_languages`** — Ngoại ngữ
- `proficiency`: `BASIC`, `CONVERSATIONAL`, `PROFESSIONAL`, `NATIVE`

---

## 4. Phân Hệ 2 — CV Scoring (Chấm Điểm CV)

Hệ thống chấm điểm gồm 3 tầng: **quy tắc chấm → chi tiết điểm từng tiêu chí → tổng điểm**.

---

### 4.1 Bảng `scoring_rules` (Quy tắc chấm điểm)

Đây là bảng cấu hình — định nghĩa **những gì cần đánh giá** và **điểm tối đa cho mỗi tiêu chí**.

| Cột | Ý nghĩa | Ví dụ |
|---|---|---|
| `rule_code` | Mã định danh duy nhất | `STAGE2_FORMAT_TYPO` |
| `category` | Nhóm tiêu chí | `ATS_FORMAT`, `CONTENT_QUALITY` |
| `max_score` | Điểm tối đa | `10.0` |
| `weight` | Trọng số | `1.5` (quan trọng hơn 1.5 lần) |
| `company_id` | Thuộc công ty nào | `null` = quy tắc toàn hệ thống |
| `is_active` | Đang áp dụng không | Tắt/bật quy tắc linh động |

**Thiết kế thông minh:** `company_id` cho phép mỗi công ty có bộ quy tắc riêng. Công ty A coi trọng chứng chỉ, công ty B coi trọng kinh nghiệm thực tế — cùng một hệ thống phục vụ được cả hai.

---

### 4.2 Bảng `cv_scores` (Tổng điểm CV)

Quan hệ **1:1** với `applications` — mỗi đơn ứng tuyển có đúng một kết quả chấm.

**Hệ thống chấm điểm 4 giai đoạn:**

```
Giai đoạn 1 — Lọc cơ bản (Pass/Fail)
  → CV có đủ thông tin tối thiểu không?

Giai đoạn 2 — Tiêu chuẩn ATS (tối đa 60 điểm)
  → Định dạng, từ khóa, cấu trúc

Giai đoạn 3 — Độ sâu kinh nghiệm (tối đa 30 điểm)
  → Số năm, vị trí, thành tựu

Giai đoạn 4 — Điểm cộng/Bonus (tối đa 10 điểm)
  → Chứng chỉ, GitHub, portfolio

TỔNG: tối đa 100 điểm
```

**⚠️ Vấn đề: JSON trong database**

Bảng này có 3 cột lưu dạng JSON text:

```
strengths     TEXT  →  '["Kinh nghiệm phong phú", "Kỹ năng đa dạng"]'
weaknesses    TEXT  →  '["Thiếu chứng chỉ", "CV nhiều lỗi chính tả"]'
priority_actions TEXT → '["Thêm chứng chỉ AWS", "Sửa lỗi format"]'
```

**Tại sao đây là vấn đề?** Vì không thể query được. Muốn biết "CV nào có weakness là thiếu chứng chỉ" thì phải dùng `LIKE '%Thiếu chứng chỉ%'` — vừa chậm vừa không chính xác. Không thể thống kê "Top 10 điểm yếu phổ biến nhất" vì dữ liệu bị nhốt trong chuỗi text.

**Giải pháp:** Tách ra bảng `cv_score_insights` (xem mục 8.3).

**Cột `raw_ai_response`** lưu toàn bộ phản hồi JSON từ Gemini — đây là backup tốt để debug khi AI trả về kết quả bất thường, nhưng nên giới hạn thời gian lưu (ví dụ 90 ngày) để tránh phình to database.

---

### 4.3 Bảng `score_details` (Chi tiết chấm từng tiêu chí)

Mỗi dòng là điểm cho **một tiêu chí cụ thể** trong một lần chấm.

| Cột | Ý nghĩa | Ví dụ |
|---|---|---|
| `criteria_name` | Tên tiêu chí | "Canh lề và định dạng" |
| `score` | Điểm đạt được | `7.5` |
| `max_score` | Điểm tối đa | `10.0` |
| `explanation` | Lý do AI chấm | "CV có 3 lỗi đánh máy ở phần kinh nghiệm" |

**Thiết kế tốt:** Lưu `explanation` giúp ứng viên hiểu tại sao bị trừ điểm, không chỉ nhìn con số.

---

## 5. Phân Hệ 3 — AI Interview (Phỏng Vấn AI)

Hệ thống phỏng vấn hoạt động theo cơ chế **vòng lặp tuần tự (State Machine)**:

```
[Khởi tạo phiên] → [AI đặt câu hỏi 1]
                         ↓
                   [Ứng viên trả lời]
                         ↓
                   [AI đánh giá câu trả lời]
                         ↓
                   [Còn câu hỏi?] ──Yes──► [AI đặt câu hỏi tiếp]
                         │
                        No
                         ↓
                   [Tổng hợp báo cáo]
                         ↓
                   [Kết thúc phiên]
```

---

### 5.1 Bảng `interview_questions` (Câu hỏi)

| Cột quan trọng | Ý nghĩa | Giá trị có thể |
|---|---|---|
| `question_type` | Loại câu hỏi | `TECHNICAL`, `BEHAVIORAL`, `SITUATIONAL`, `FOLLOW_UP` |
| `difficulty` | Độ khó | `EASY`, `MEDIUM`, `HARD` |
| `topic` | Chủ đề | `Java`, `Database`, `System Design` |
| `expected_keywords` | Từ khóa mong đợi | `["OOP", "Polymorphism", "Encapsulation"]` (JSON) |
| `parent_question_id` | Câu hỏi cha | Self-reference: câu hỏi đào sâu từ câu trước |
| `question_order` | Thứ tự | 1, 2, 3... |

**Tính năng thú vị: `parent_question_id`** — đây là self-reference (bảng tự trỏ vào chính nó). Khi ứng viên trả lời không rõ, AI tạo câu hỏi follow-up và liên kết vào câu hỏi gốc. Cho phép build cấu trúc cây câu hỏi.

**⚠️ Lưu ý:** `expected_keywords` cũng đang lưu dạng JSON text. Ổn nếu chỉ để tham chiếu, nhưng không query được.

---

### 5.2 Bảng `interview_answers` (Câu trả lời)

Quan hệ **1:1** với `interview_questions` — mỗi câu hỏi có đúng một câu trả lời.

| Cột | Ý nghĩa |
|---|---|
| `answer_text` | Nội dung câu trả lời |
| `answered_at` | Thời điểm gửi |
| `response_time_seconds` | Thời gian ứng viên suy nghĩ |

**`response_time_seconds`** là dữ liệu ẩn rất có giá trị: ứng viên trả lời câu kỹ thuật trong 5 giây có thể đã chuẩn bị sẵn hoặc copy-paste, trong khi 120 giây cho thấy đang suy nghĩ thực sự. AI có thể dùng dữ liệu này để đánh giá thêm.

---

### 5.3 Bảng `interview_evaluations` (Đánh giá từng câu)

Quan hệ **1:1** với `interview_answers`.

| Cột | Ý nghĩa |
|---|---|
| `score` | Điểm 1–10 |
| `feedback` | Nhận xét chi tiết |
| `matched_keywords` | Từ khóa ứng viên đã đề cập đúng |
| `missed_keywords` | Từ khóa bị bỏ sót |
| `improvement_suggestion` | Gợi ý cải thiện |

**Thiết kế tốt:** Tách `matched_keywords` và `missed_keywords` rõ ràng giúp ứng viên biết mình thiếu gì, không chỉ nhận điểm số mơ hồ.

---

### 5.4 Bảng `interview_reports` (Báo cáo tổng kết)

Quan hệ **1:1** với `interview_sessions`.

| Cột | Ý nghĩa |
|---|---|
| `final_score` | Điểm tổng (0–100) |
| `decision` | `PASS`, `CONSIDER`, `FAIL` |
| `technical_score` | Điểm chuyên môn (1–10) |
| `communication_score` | Điểm giao tiếp (1–10) |
| `problem_solving_score` | Điểm tư duy giải quyết vấn đề (1–10) |
| `recommendation` | Đề xuất bước tiếp theo cho HR |

**⚠️ Vấn đề kiểu dữ liệu:** `final_score` dùng `INT` (0–100) nhưng `cv_scores.total_score` dùng `DOUBLE`. Hai hệ thống điểm không nhất quán, gây khó khi so sánh hoặc tổng hợp.

---

## 6. Những Điểm Mạnh Của Thiết Kế Hiện Tại

### ✅ Chuẩn hóa đúng hướng
Không lưu JSON blob, tất cả thông tin được tách thành bảng riêng có quan hệ rõ ràng. Đây là nền tảng tốt để scale.

### ✅ Phân cấp điểm CV rõ ràng
4 giai đoạn chấm điểm (cơ bản → ATS → kinh nghiệm → bonus) phản ánh đúng quy trình tuyển dụng thực tế.

### ✅ Vòng lặp phỏng vấn thông minh
State machine (khởi tạo → hỏi → chấm → hỏi tiếp → báo cáo) đảm bảo luồng xử lý nhất quán, không bị lạc giữa chừng.

### ✅ Lưu trữ `response_time_seconds`
Dữ liệu ẩn có giá trị cao cho phân tích hành vi ứng viên.

### ✅ `scoring_rules` có thể tùy biến theo công ty
Thiết kế multi-tenant linh hoạt, không cần fork code để phục vụ nhiều khách hàng.

### ✅ Lưu `raw_ai_response`
Tốt cho debugging khi AI trả về kết quả bất thường.

---

## 7. Các Vấn Đề Cần Cải Tiến

### 🔴 Nghiêm trọng (cần xử lý trước khi go-live)

---

#### Vấn đề 1: Không có Index trên Foreign Key

**Hiện trạng:** Các cột `resume_id`, `application_id`, `session_id`... không có index.

**Ảnh hưởng thực tế:**
Khi hệ thống có 10,000 CV, mỗi CV trung bình 15 kỹ năng → bảng `resume_skills` có 150,000 dòng. Mỗi lần query "lấy kỹ năng của CV này", database phải **quét toàn bộ 150,000 dòng** thay vì nhảy thẳng đến 15 dòng cần lấy.

**So sánh:**

| | Không có Index | Có Index |
|---|---|---|
| Query skills của 1 CV | ~500ms | ~5ms |
| Lọc theo tên kỹ năng | ~2000ms | ~10ms |
| Join resumes + skills | ~10 giây | ~50ms |

**Mức độ nghiêm trọng:** Hệ thống sẽ chạy chậm ngay từ khi có vài nghìn ứng viên. Đây là lỗi cơ bản nhất cần sửa.

---

#### Vấn đề 2: Không có Soft Delete

**Hiện trạng:** Khi xóa CV, dữ liệu mất vĩnh viễn trong database.

**Hệ quả:**
- Ứng viên xóa nhầm CV → không khôi phục được
- Không theo dõi được "ai xóa cái gì, lúc nào"
- Vi phạm GDPR: phải có audit trail về việc xử lý dữ liệu cá nhân
- Không thể có tính năng "Thùng rác" (Trash/Recycle Bin)

**Giải pháp:** Thêm cột `deleted_at TIMESTAMP` và `deleted_by BIGINT`. Thay vì xóa thật, chỉ ghi thời gian xóa vào cột này. Khi query, tự động lọc `WHERE deleted_at IS NULL`.

---

#### Vấn đề 3: Thông tin cá nhân lưu plaintext

**Hiện trạng:** `email`, `phone`, `address` trong `resume_basic_info` lưu trực tiếp, không mã hóa.

**Rủi ro:**
- Nếu database bị hack hoặc dump: toàn bộ email/phone của ứng viên bị lộ
- Vi phạm GDPR — dữ liệu PII (Personally Identifiable Information) phải được bảo vệ
- Reputation của công ty bị ảnh hưởng nghiêm trọng

**Giải pháp:** Mã hóa ở tầng ứng dụng (AES-256) trước khi lưu vào DB. JPA Converter tự động encrypt khi lưu, decrypt khi đọc — code ở tầng trên không cần thay đổi.

**Lưu ý kỹ thuật quan trọng:** Phải dùng **IV (Initialization Vector) ngẫu nhiên riêng cho mỗi lần mã hóa** và lưu IV cùng với ciphertext. Nếu dùng cùng một IV cho tất cả, hệ thống mã hóa sẽ yếu và có thể bị phá. Tài liệu hiện tại chưa đề cập rõ điều này.

**Hệ quả phụ:** Sau khi mã hóa, không thể `WHERE email = 'abc@gmail.com'`. Giải pháp là lưu thêm **hash** (SHA-256) của email vào một cột riêng chỉ dùng để tìm kiếm/so sánh.

---

### 🟠 Quan trọng (nên xử lý trong 2 tuần đầu)

---

#### Vấn đề 4: Kiểu dữ liệu điểm số không nhất quán

**Hiện trạng:**
- `cv_scores.total_score` → `DOUBLE`
- `interview_reports.final_score` → `INT`
- `score_details.score` → `DOUBLE`
- `interview_evaluations.score` → `INT`

**Vấn đề với `DOUBLE`:** Kiểu số thực dấu phẩy động không lưu chính xác tuyệt đối. Phép tính `0.1 + 0.2` trong máy tính cho ra `0.30000000000000004`, không phải `0.3`. Với điểm số tuyển dụng, sai số này có thể dẫn đến kết quả hiển thị kỳ lạ (ví dụ: 87.499999 thay vì 87.5).

**Vấn đề với `INT` cho `final_score`:** Mất độ chính xác. Điểm 87.5 bị làm tròn thành 87 hoặc 88 — ảnh hưởng đến xếp hạng ứng viên.

**Giải pháp:** Dùng `DECIMAL(5,2)` cho tất cả điểm số. Ví dụ: `87.50`, `100.00`, `0.00`. Chính xác tuyệt đối, không có lỗi floating-point.

---

#### Vấn đề 5: JSON chưa normalize trong `cv_scores`

**Hiện trạng:** Ba cột `strengths`, `weaknesses`, `priority_actions` lưu mảng JSON dạng text.

**Không thể làm được:**
- Tìm tất cả CV có weakness cụ thể
- Thống kê "Top 5 điểm yếu phổ biến nhất"
- Analytics cho HR dashboard
- Index để tăng tốc tìm kiếm

**Giải pháp:** Tạo bảng `cv_score_insights` với các cột: `type` (STRENGTH/WEAKNESS/ACTION), `title`, `description`, `priority`. Mỗi điểm mạnh/yếu là một dòng riêng.

---

#### Vấn đề 6: Thiếu Audit Fields

**Hiện trạng:** Nhiều bảng không có `created_at`, `updated_at`, `created_by`, `updated_by`.

**Hệ quả:**
- Không biết record được tạo/sửa khi nào, bởi ai
- Khó debug khi có sự cố dữ liệu
- Không đáp ứng yêu cầu audit của GDPR
- Không thể build tính năng "lịch sử thay đổi"

---

### 🟡 Cần thiết cho vận hành ổn định

---

#### Vấn đề 7: Không có cơ chế Fallback khi AI gặp lỗi

**Hiện trạng:** Nếu Gemini API không phản hồi (timeout, lỗi, bảo trì), toàn bộ luồng chấm điểm CV và phỏng vấn sẽ thất bại.

**Hệ quả:** Ứng viên nộp CV nhưng không nhận được kết quả. Trải nghiệm người dùng rất tệ.

**Giải pháp:** Xây dựng hệ thống chấm điểm dự phòng dựa trên quy tắc (rule-based) — không thông minh bằng AI nhưng vẫn trả về điểm số hợp lý. Khi Gemini phục hồi, hệ thống tự động chấm lại.

---

#### Vấn đề 8: Chưa có GDPR Consent Management

**Hiện trạng:** Không có bảng nào theo dõi ứng viên đã đồng ý cho phép xử lý dữ liệu chưa.

**Yêu cầu pháp lý (GDPR):**
- Phải có bằng chứng người dùng đã đồng ý trước khi AI phân tích CV của họ
- Phải cho phép rút lại đồng ý bất cứ lúc nào
- Phải cho phép export toàn bộ dữ liệu cá nhân theo yêu cầu
- Phải cho phép xóa hoàn toàn dữ liệu (Right to be Forgotten)

---

## 8. Kế Hoạch Cải Tiến Chi Tiết

### 8.1 Thêm Indexes (Ưu tiên cao nhất)

Cần thêm index cho tất cả foreign key và các query pattern hay dùng:

**Index cho foreign key** (bắt buộc, thiếu là chậm):
```
resume_basic_info    → resume_id
resume_skills        → resume_id
resume_experiences   → resume_id
resume_educations    → resume_id
resume_certifications → resume_id
resume_projects      → resume_id
resume_languages     → resume_id
cv_scores            → application_id
score_details        → cv_score_id, scoring_rule_id
interview_sessions   → application_id
interview_questions  → session_id
interview_answers    → question_id
interview_evaluations → answer_id
interview_reports    → session_id
```

**Composite index** cho query phức tạp (tìm ứng viên theo nhiều tiêu chí):
```
resume_skills        → (skill_name, proficiency_level)
resume_experiences   → (position, start_date, is_current)
cv_scores            → (total_score DESC, scored_at)
scoring_rules        → (is_active, version)
```

**Giải thích Composite Index:** Thay vì tạo 2 index riêng cho `skill_name` và `proficiency_level`, một composite index `(skill_name, proficiency_level)` hiệu quả hơn nhiều cho query "tìm người có Java ADVANCED" vì database có thể dùng cả hai điều kiện trong cùng một lần tra cứu index.

---

### 8.2 Triển khai Soft Delete

**Các bảng cần áp dụng:**
- `resumes` (quan trọng nhất — dữ liệu ứng viên)
- `applications` (đơn ứng tuyển)
- `interview_sessions` (lịch sử phỏng vấn)
- `cv_scores` (kết quả chấm)

**Cách hoạt động:**
Thay vì `DELETE FROM resumes WHERE id = 123`, hệ thống chỉ làm:
`UPDATE resumes SET deleted_at = NOW(), deleted_by = 456 WHERE id = 123`

Tất cả query bình thường sẽ tự động lọc `WHERE deleted_at IS NULL`, nên người dùng không thấy record đã xóa. Admin có thể xem và khôi phục nếu cần.

**Scheduled Cleanup Job:** Mỗi tháng một lần, tự động xóa vĩnh viễn các record đã soft-delete quá 90 ngày — tuân thủ chính sách lưu trữ dữ liệu và tránh phình to database.

---

### 8.3 Bảng `cv_score_insights` mới (Thay thế JSON)

**Cấu trúc đề xuất:**

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | BIGINT PK | |
| `cv_score_id` | BIGINT FK | Liên kết đến `cv_scores` |
| `type` | ENUM | `STRENGTH`, `WEAKNESS`, `ACTION` |
| `title` | VARCHAR(255) | Tiêu đề ngắn gọn |
| `description` | TEXT | Giải thích chi tiết |
| `priority` | INT | 1 = cao nhất, 5 = thấp nhất |
| `display_order` | INT | Thứ tự hiển thị |

**Lợi ích sau khi chuyển sang bảng này:**
- Query: "CV nào có điểm yếu là thiếu chứng chỉ?" → `WHERE type='WEAKNESS' AND title LIKE '%chứng chỉ%'`
- Thống kê: "Top 5 điểm yếu phổ biến nhất tháng này" → `GROUP BY title ORDER BY COUNT(*)`
- Lọc theo priority: chỉ hiển thị điểm yếu nghiêm trọng nhất

**Migration:** Đọc JSON cũ từ `strengths/weaknesses/priority_actions`, parse ra từng phần tử, insert vào bảng mới. Sau khi xác nhận data OK, xóa 3 cột JSON cũ.

---

### 8.4 Chuẩn hóa kiểu dữ liệu điểm số

**Quy tắc đề xuất:**

| Loại điểm | Kiểu nên dùng | Lý do |
|---|---|---|
| Điểm CV tổng (0–100) | `DECIMAL(5,2)` | Cần chính xác đến 0.01, ví dụ 87.50 |
| Điểm giai đoạn (0–60) | `DECIMAL(5,2)` | Tương tự |
| Điểm phỏng vấn tổng (0–100) | `DECIMAL(5,2)` | Nhất quán với CV score |
| Điểm từng câu trả lời (1–10) | `TINYINT` | Số nguyên, không cần phần thập phân |
| GPA (0.0–4.0) | `DECIMAL(3,2)` | 3.75, 2.80... |
| Số năm kinh nghiệm | `DECIMAL(4,1)` | 3.5 năm, 0.5 năm... |

**Tại sao không dùng DOUBLE:** DOUBLE là kiểu binary floating-point — máy tính không thể biểu diễn chính xác một số như 87.5 trong hệ nhị phân, nên sẽ xảy ra sai số nhỏ. DECIMAL lưu chính xác từng chữ số thập phân, không bao giờ có lỗi làm tròn.

---

### 8.5 GDPR Compliance — Các bảng cần thêm

#### Bảng `user_data_consents` (Đồng ý xử lý dữ liệu)

| Cột | Ý nghĩa |
|---|---|
| `user_id` | Người dùng nào |
| `consent_type` | Loại đồng ý: `DATA_PROCESSING`, `AI_ANALYSIS`, `MARKETING`... |
| `granted` | Đã đồng ý chưa |
| `granted_at` | Đồng ý lúc nào |
| `revoked_at` | Rút lại lúc nào (nếu có) |
| `ip_address` | IP lúc bấm đồng ý (bằng chứng pháp lý) |
| `expires_at` | Hết hạn đồng ý (nếu có) |

**Quy tắc kinh doanh:** Trước khi AI phân tích CV của ứng viên, hệ thống phải kiểm tra có record đồng ý hợp lệ không. Nếu không có → từ chối xử lý.

#### Bảng `data_processing_logs` (Nhật ký xử lý dữ liệu)

Ghi lại mọi hành động xử lý dữ liệu cá nhân: ai xử lý, xử lý gì, lúc nào, mục đích gì. Đây là yêu cầu bắt buộc của GDPR Article 30.

#### Bảng `data_retention_policies` (Chính sách lưu trữ)

Định nghĩa mỗi loại dữ liệu được lưu bao lâu:
- Resume: 365 ngày
- CV Score: 365 ngày
- Interview Session: 180 ngày
- Application: 730 ngày

---

### 8.6 Cơ chế Fallback cho AI Service

**Kiến trúc đề xuất:**

```
Yêu cầu chấm điểm
       ↓
[Kiểm tra Gemini có sẵn không?]
       ↓                    ↓
    CÓ                    KHÔNG
       ↓                    ↓
[Gọi Gemini API]    [Chấm bằng quy tắc cố định]
       ↓                    ↓
[Ghi scoring_version   [Ghi scoring_version
 = "gemini-v1"]         = "rule-based-v1"]
       ↓                    ↓
    [Lưu kết quả vào database]
```

**Circuit Breaker Pattern:** Nếu Gemini lỗi 5 lần liên tiếp trong 10 request → tự động "ngắt mạch", ngừng gọi Gemini trong 60 giây, dùng fallback cho tất cả request trong thời gian này. Sau 60 giây, thử lại Gemini. Tránh gọi liên tục vào service đang lỗi gây chậm cả hệ thống.

---

### 8.7 Redis Caching

**Những gì nên cache và bao lâu:**

| Dữ liệu | Thời gian cache | Lý do |
|---|---|---|
| `scoring_rules` active | 1 giờ | Hiếm khi thay đổi, đọc rất nhiều lần |
| Resume đã parse | 30 phút | Xem đi xem lại nhiều lần trong review |
| User profile | 15 phút | Đọc nhiều, thay đổi ít |
| Interview questions | 2 giờ | Câu hỏi mẫu ít thay đổi |

**Tại sao cần cache:** Mỗi lần xem một CV, hệ thống phải query 7–8 bảng (basic_info, skills, experiences...). Với Redis cache, lần đọc thứ 2 trở đi chỉ tốn 1–5ms thay vì 50–200ms.

**Quy tắc quan trọng:** Khi dữ liệu thay đổi (cập nhật CV, xóa kỹ năng...) phải xóa cache tương ứng ngay lập tức, nếu không người dùng sẽ thấy dữ liệu cũ.

---

## 9. Thứ Tự Ưu Tiên Thực Hiện

### Giai đoạn A — Trước Go-Live (bắt buộc)

| # | Việc cần làm | Lý do |
|---|---|---|
| 1 | Thêm indexes cho tất cả foreign key | Hệ thống chạy chậm ngay từ sớm |
| 2 | Fix kiểu dữ liệu: DOUBLE → DECIMAL | Lỗi tính toán điểm số |
| 3 | Soft delete cho resumes, applications | Không thể phục hồi dữ liệu |
| 4 | Mã hóa email/phone/address | Rủi ro bảo mật nghiêm trọng |
| 5 | Thêm audit fields (created_at, updated_at) | Cần thiết cho debugging |

### Giai đoạn B — 2 Tuần Sau Launch

| # | Việc cần làm | Lý do |
|---|---|---|
| 6 | Tạo bảng `cv_score_insights` | Analytics và query linh hoạt hơn |
| 7 | GDPR consent tables | Yêu cầu pháp lý |
| 8 | Composite indexes | Tối ưu query tìm kiếm ứng viên |
| 9 | AI fallback mechanism | Đảm bảo hệ thống hoạt động khi Gemini lỗi |

### Giai đoạn C — 1–2 Tháng Sau

| # | Việc cần làm | Lý do |
|---|---|---|
| 10 | Redis caching layer | Tối ưu hiệu năng khi có nhiều user |
| 11 | Circuit breaker (Resilience4j) | Hệ thống chịu lỗi tốt hơn |
| 12 | GDPR Right to be Forgotten | Tuân thủ pháp lý đầy đủ |
| 13 | Data retention scheduled job | Tự động dọn dẹp dữ liệu cũ |

---

## Tóm Tắt Tổng Thể

Thiết kế hiện tại của AI-Hires có **nền tảng vững chắc** — chuẩn hóa 3NF đúng, flow phỏng vấn hợp lý, phân hệ rõ ràng. Đây không phải dự án cần làm lại từ đầu.

Những việc cần làm chủ yếu là **bổ sung và tăng cường** — thêm index, thêm bảo mật, thêm khả năng chịu lỗi — chứ không phải thay đổi kiến trúc cốt lõi.

Rủi ro lớn nhất ngay bây giờ là **thiếu index** (hiệu năng) và **không mã hóa PII** (bảo mật). Hai điều này cần được xử lý trước khi hệ thống tiếp nhận dữ liệu thật của ứng viên.

---

*Tài liệu review bởi Claude · Dựa trên AI_Hire_Database_Specs.md và AI_Hires_Improvement_Plan.md*
