# 📋 AI-Hires Database — Review & Kế Hoạch Cải Tiến (v2)

> **Dựa trên:** `AI_Hire_Database_Specs.md` (phiên bản mới nhất — đã có Giai đoạn 4 Indexing)
> **Mục đích:** Đọc hiểu, không phải để code ngay

---

## MỤC LỤC

1. [Những gì đã thay đổi so với phiên bản trước](#1-những-gì-đã-thay-đổi-so-với-phiên-bản-trước)
2. [Đánh giá tổng thể hiện tại](#2-đánh-giá-tổng-thể-hiện-tại)
3. [Phân tích từng phân hệ](#3-phân-tích-từng-phân-hệ)
4. [Các vấn đề còn tồn tại](#4-các-vấn-đề-còn-tồn-tại)
5. [Kế hoạch cải tiến đề xuất](#5-kế-hoạch-cải-tiến-đề-xuất)
6. [Thứ tự ưu tiên thực hiện](#6-thứ-tự-ưu-tiên-thực-hiện)

---

## 1. Những gì đã thay đổi so với phiên bản trước

File mới này bổ sung thêm **Giai đoạn 4: Tối Ưu Chỉ Mục** và ghi nhận rõ các index đã được thêm vào từng bảng. Cụ thể:

| Bảng | Index đã thêm | Trạng thái |
|---|---|---|
| `resume_skills` | `idx_resume_skills_resume_id` trên `resume_id` | ✅ Có |
| `resume_experiences` | `idx_resume_experiences_resume_id` trên `resume_id` | ✅ Có |
| `resume_educations` | `idx_resume_educations_resume_id` trên `resume_id` | ✅ Có |
| `resume_certifications` | `idx_resume_certs_resume_id` trên `resume_id` | ✅ Có |
| `resume_projects` | `idx_resume_projects_resume_id` trên `resume_id` | ✅ Có |
| `resume_languages` | `idx_resume_languages_resume_id` trên `resume_id` | ✅ Có |
| `interview_questions` | `idx_interview_questions_session_id` trên `session_id` | ✅ Có |
| `scoring_rules` | `idx_rule_code` (UNIQUE) trên `rule_code` | ✅ Có |
| `resume_basic_info` | — | ❌ Chưa có |
| `cv_scores` | — | ❌ Chưa có |
| `score_details` | — | ❌ Chưa có |
| `interview_answers` | — | ❌ Chưa có |
| `interview_evaluations` | — | ❌ Chưa có |
| `interview_reports` | — | ❌ Chưa có |

**Nhận xét:** Giai đoạn 4 đã giải quyết được ~50% vấn đề index. Các bảng phụ (skills, experiences...) liên quan đến CV đã có index. Nhưng các bảng phía scoring và interview vẫn chưa có — đây là phần hay bị bỏ sót nhất.

---

## 2. Đánh giá tổng thể hiện tại

### ✅ Điểm mạnh (giữ nguyên, không cần thay đổi)

**Kiến trúc chuẩn hóa 3NF đúng hướng.** Quyết định loại bỏ JSON blob và tách từng phần thông tin CV thành bảng riêng là nền tảng đúng. Hệ thống có thể query, filter, và analytics linh hoạt — điều không thể làm được nếu lưu toàn bộ CV trong một cột JSON.

**Phân hệ rõ ràng, không chồng chéo.** Ba phân hệ (CV Parsing, CV Scoring, AI Interview) độc lập và liên kết qua `applications` — đây là thiết kế có thể scale module độc lập sau này.

**Flow phỏng vấn State Machine hợp lý.** Chuỗi: `Session → Question → Answer → Evaluation → Report` đảm bảo dữ liệu không bị lạc giữa các bước. Đặc biệt, `parent_question_id` cho phép tạo câu hỏi follow-up liên kết với câu hỏi gốc — một tính năng ít hệ thống nào nghĩ đến.

**`scoring_rules` hỗ trợ multi-tenant.** Cột `company_id` cho phép mỗi công ty có bộ quy tắc chấm riêng. Đây là thiết kế thông minh cho mô hình SaaS.

**`response_time_seconds` trong `interview_answers`.** Dữ liệu ẩn có giá trị cao. Thời gian phản hồi có thể tiết lộ nhiều điều về mức độ tự tin và chuẩn bị của ứng viên.

---

### 🔴 Điểm yếu (cần xử lý)

**Vẫn còn JSON trong database.** Ba cột `strengths`, `weaknesses`, `priority_actions` trong `cv_scores` và hai cột `strengths`, `weaknesses` trong `interview_reports` vẫn lưu dạng text JSON. Đây là điểm mâu thuẫn lớn: tài liệu tuyên bố đã "loại bỏ hoàn toàn JSON" nhưng thực tế vẫn còn.

**Kiểu dữ liệu điểm số không nhất quán.** `cv_scores` dùng `DOUBLE` nhưng `interview_evaluations` dùng `INT`. Hai hệ thống điểm số không thể so sánh trực tiếp.

**Thiếu Soft Delete.** Xóa dữ liệu là xóa vĩnh viễn.

**Không có mã hóa PII.** `email`, `phone`, `address` lưu plaintext.

**Thiếu audit trail.** Nhiều bảng không có `created_at`, `updated_at`.

---

## 3. Phân tích từng phân hệ

### 3.1 Phân hệ CV Parsing — Tổng quan

```
RESUMES (trung tâm)
  ├── resume_basic_info   [1:1]  → thông tin cá nhân
  ├── resume_skills       [1:N]  → kỹ năng
  ├── resume_experiences  [1:N]  → kinh nghiệm
  ├── resume_educations   [1:N]  → học vấn
  ├── resume_certifications [1:N] → chứng chỉ
  ├── resume_projects     [1:N]  → dự án
  └── resume_languages    [1:N]  → ngoại ngữ
```

**`resume_basic_info` — Nhận xét chi tiết:**

Bảng này chứa hầu hết dữ liệu nhạy cảm nhất của ứng viên. Có hai vấn đề cần lưu ý:

Thứ nhất, `email`, `phone`, `address`, `date_of_birth` đang lưu plaintext. Đây là dữ liệu PII (Personally Identifiable Information) — nếu database bị dump hoặc tấn công, toàn bộ thông tin cá nhân ứng viên bị lộ ngay lập tức.

Thứ hai, `predicted_level` và `predicted_industry` dùng `VARCHAR(50)` và `VARCHAR(255)` thay vì ENUM. Nếu AI trả về giá trị không chuẩn (ví dụ "Sr" thay vì "SENIOR"), dữ liệu sẽ không nhất quán và query sẽ bị sai.

**`resume_skills` — Nhận xét:**

Index `resume_id` đã có — tốt. Tuy nhiên `years_of_experience` dùng `DOUBLE` thay vì `DECIMAL(4,1)`. Với số năm kinh nghiệm như 3.5, 0.5, kiểu DECIMAL chính xác hơn và không gây lỗi floating-point.

**`resume_projects` — Nhận xét:**

Cột `technologies` lưu dạng `TEXT` (ví dụ: "Java, Spring Boot, React"). Điều này có nghĩa là không thể query "tìm ứng viên có dự án dùng React". Đây là trade-off chấp nhận được ở giai đoạn đầu, nhưng cần ghi nhận là giới hạn.

---

### 3.2 Phân hệ CV Scoring — Tổng quan

```
APPLICATIONS
  └── cv_scores [1:1]
        └── score_details [1:N]
                └── scoring_rules [N:1]
```

**`cv_scores` — Vấn đề lớn nhất của file:**

Bảng này có mâu thuẫn rõ ràng. Phần mở đầu tài liệu ghi: *"Hệ thống đã loại bỏ hoàn toàn việc lưu trữ các tệp JSON cồng kềnh"*, nhưng chính bảng này vẫn có 3 cột JSON:

```
strengths       TEXT  →  '["Kỹ năng đa dạng", "Kinh nghiệm phong phú"]'
weaknesses      TEXT  →  '["Thiếu chứng chỉ", "CV nhiều lỗi"]'
priority_actions TEXT →  '["Thêm AWS cert", "Sửa định dạng"]'
```

Không thể làm gì với 3 cột này ngoài việc đọc và hiển thị nguyên vẹn. Không thể thống kê, không thể filter, không thể index.

**Hệ thống 4 giai đoạn chấm — Thiết kế tốt:**

```
Stage 1: Lọc cơ bản (Pass/Fail)
Stage 2: Tiêu chuẩn ATS     → tối đa 60 điểm
Stage 3: Độ sâu kinh nghiệm → tối đa 30 điểm
Stage 4: Bonus               → tối đa 10 điểm
TỔNG                         → tối đa 100 điểm
```

Logic rõ ràng, có thể giải thích cho ứng viên dễ hiểu.

**`score_details` — Thiếu index:**

Bảng này có `cv_score_id` và `scoring_rule_id` là foreign key nhưng chưa có index. Khi có hàng chục nghìn lần chấm điểm, query lấy chi tiết điểm của một CV sẽ chậm.

---

### 3.3 Phân hệ AI Interview — Tổng quan

```
APPLICATIONS
  └── interview_sessions [1:N]
        ├── interview_questions [1:N]
        │     └── interview_answers [1:1]
        │           └── interview_evaluations [1:1]
        └── interview_reports [1:1]
```

**Flow dữ liệu thực tế:**

Khi một phiên phỏng vấn diễn ra, dữ liệu được tạo theo thứ tự sau:
1. `interview_sessions` — record phiên được tạo
2. `interview_questions` — AI tạo câu hỏi đầu tiên
3. `interview_answers` — ứng viên gửi câu trả lời
4. `interview_evaluations` — AI chấm câu trả lời
5. Lặp lại bước 2–4 cho đến hết câu hỏi
6. `interview_reports` — AI tổng hợp báo cáo cuối

**`interview_questions` — Điểm tốt:**

`parent_question_id` tự liên kết (self-reference) cho phép câu hỏi follow-up trỏ về câu hỏi cha. Đây là cấu trúc cây (tree) trong database — đúng cách để model adaptive interviewing.

`expected_keywords` lưu JSON là chấp nhận được ở đây, vì đây chỉ là dữ liệu tham chiếu để AI so sánh, không cần query từng keyword riêng lẻ.

**`interview_reports` — Vấn đề JSON lặp lại:**

Giống `cv_scores`, bảng này cũng có `strengths` và `weaknesses` dạng JSON TEXT. Nếu muốn analytics "ứng viên thường yếu về điểm gì nhất qua phỏng vấn" thì không làm được.

**Thiếu index hoàn toàn cho phía interview:**

`interview_answers.question_id`, `interview_evaluations.answer_id`, `interview_reports.session_id` — tất cả đều chưa có index dù là foreign key.

---

## 4. Các vấn đề còn tồn tại

### 🔴 Nghiêm trọng

---

#### Vấn đề 1: JSON vẫn còn trong database (mâu thuẫn với tuyên bố thiết kế)

**Vị trí:**
- `cv_scores`: `strengths`, `weaknesses`, `priority_actions`
- `interview_reports`: `strengths`, `weaknesses`

**Vấn đề cụ thể:** Không thể thực hiện bất kỳ truy vấn có ý nghĩa nào trên 5 cột này. Toàn bộ giá trị của chúng là để đọc và hiển thị — không hơn. Điều này có nghĩa là:

- Không có dashboard "Top điểm yếu phổ biến nhất của ứng viên tháng này"
- Không thể filter "CV nào có điểm yếu về kỹ năng giao tiếp"
- Không thể so sánh điểm yếu CV vs điểm yếu phỏng vấn của cùng một ứng viên

---

#### Vấn đề 2: Thiếu index trên 6 foreign key quan trọng

**Các cột chưa có index:**

| Bảng | Cột | Tác động |
|---|---|---|
| `cv_scores` | `application_id` | Chậm khi tìm điểm CV theo đơn ứng tuyển |
| `score_details` | `cv_score_id` | Chậm khi lấy chi tiết điểm của một CV |
| `score_details` | `scoring_rule_id` | Chậm khi query quy tắc nào được áp dụng |
| `interview_answers` | `question_id` | Chậm khi lấy câu trả lời theo câu hỏi |
| `interview_evaluations` | `answer_id` | Chậm khi lấy đánh giá theo câu trả lời |
| `interview_reports` | `session_id` | Chậm khi lấy báo cáo theo phiên phỏng vấn |

**Ảnh hưởng thực tế:** Khi xem một hồ sơ ứng viên hoàn chỉnh, hệ thống phải join nhiều bảng. Thiếu index trên các bảng phía scoring và interview sẽ làm trang chi tiết ứng viên tải chậm ngay khi có vài nghìn record.

---

#### Vấn đề 3: Thông tin cá nhân lưu plaintext

**Dữ liệu nhạy cảm đang lộ hoàn toàn:**
- `email` trong `resume_basic_info`
- `phone` trong `resume_basic_info`
- `address` trong `resume_basic_info`
- `date_of_birth` trong `resume_basic_info`

**Rủi ro:** Nếu server bị tấn công hoặc có người trong nội bộ có quyền truy cập DB, toàn bộ thông tin cá nhân của ứng viên bị lộ ngay lập tức — không cần bước giải mã nào. Đây là vi phạm nguyên tắc bảo mật cơ bản và có thể vi phạm pháp lý (GDPR hoặc tương đương tại Việt Nam là Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân).

---

#### Vấn đề 4: Không có Soft Delete

**Hiện trạng:** Không có cột `deleted_at` ở bất kỳ bảng nào.

**Hệ quả trực tiếp:**
- Ứng viên xóa nhầm CV → mất vĩnh viễn, không khôi phục được
- HR xóa nhầm application → mất toàn bộ lịch sử chấm điểm và phỏng vấn liên quan
- Không có tính năng "Thùng rác"
- Không audit được "ai đã xóa gì, lúc nào"

---

### 🟠 Quan trọng

---

#### Vấn đề 5: Kiểu dữ liệu điểm số không nhất quán và không chính xác

**Thực trạng:**

| Bảng/Cột | Kiểu hiện tại | Vấn đề |
|---|---|---|
| `cv_scores.total_score` | `DOUBLE` | Lỗi floating-point |
| `cv_scores.stage*_score` | `DOUBLE` | Lỗi floating-point |
| `score_details.score` | `DOUBLE` | Lỗi floating-point |
| `interview_evaluations.score` | `INT` | Mất phần thập phân |
| `interview_reports.final_score` | `INT` | Không nhất quán với CV score |
| `resume_educations.gpa` | `DOUBLE` | Lỗi floating-point |
| `resume_skills.years_of_experience` | `DOUBLE` | Lỗi floating-point |

**Tại sao `DOUBLE` có vấn đề:** Máy tính lưu số thực theo hệ nhị phân, và một số như `87.5` không thể biểu diễn chính xác trong hệ nhị phân — dẫn đến kết quả như `87.49999999999999` hoặc `87.50000000000001`. Với điểm số tuyển dụng, điều này gây lỗi hiển thị và sai khi so sánh (ví dụ: điểm `87.5` không bằng `87.5` vì hai giá trị binary khác nhau).

**Giải pháp:** Dùng `DECIMAL(5,2)` cho điểm số (lưu chính xác đến 2 chữ số thập phân), `DECIMAL(3,2)` cho GPA, `DECIMAL(4,1)` cho số năm kinh nghiệm.

---

#### Vấn đề 6: `predicted_level` và `predicted_industry` nên là ENUM

**Hiện trạng:** `VARCHAR(50)` và `VARCHAR(255)`.

**Vấn đề:** Nếu AI đôi khi trả về "Sr" thay vì "SENIOR", hoặc "junior" (thường) thay vì "JUNIOR" (hoa), dữ liệu sẽ không nhất quán. Query `WHERE predicted_level = 'SENIOR'` sẽ bỏ sót các record "Sr" hay "Senior".

**Giải pháp:** Thêm bước chuẩn hóa ở tầng service trước khi lưu, hoặc dùng ENUM constraint ở tầng DB để database tự từ chối giá trị không hợp lệ.

---

#### Vấn đề 7: Thiếu audit fields ở hầu hết bảng

**Bảng nào thiếu `created_at`/`updated_at`:**
- `resume_basic_info` — không biết thông tin được trích xuất lúc nào
- `resume_skills`, `resume_experiences`, `resume_educations`, `resume_certifications`, `resume_projects`, `resume_languages` — toàn bộ nhóm này thiếu
- `cv_scores` — có `scored_at` nhưng không có `updated_at`
- `score_details` — hoàn toàn thiếu
- `scoring_rules` — không biết quy tắc được tạo/sửa khi nào

Chỉ có `interview_questions`, `interview_evaluations`, `interview_reports` là có `created_at`.

---

### 🟡 Nên làm để hoàn thiện

---

#### Vấn đề 8: `raw_ai_response` trong `cv_scores` sẽ phình to

Cột `LONGTEXT` lưu toàn bộ JSON response từ Gemini. Mỗi response có thể vài KB đến vài chục KB. Khi có hàng chục nghìn CV, bảng này sẽ rất lớn và ảnh hưởng đến toàn bộ performance.

**Khuyến nghị:** Đặt chính sách xóa `raw_ai_response` sau 30–90 ngày (khi debug không còn cần thiết), hoặc chuyển sang lưu ở object storage (S3/MinIO) và chỉ lưu URL vào DB.

---

#### Vấn đề 9: Không có bảng quản lý phiên bản scoring

`scoring_version` trong `cv_scores` lưu chuỗi tự do như "v1", "v2". Nếu sau này có nhiều phiên bản thuật toán, không biết phiên bản nào khác phiên bản nào như thế nào, khi nào được áp dụng, do ai tạo ra.

---

## 5. Kế hoạch cải tiến đề xuất

### 5.1 Hoàn thiện Index — Bổ sung phần còn thiếu

Giai đoạn 4 đã làm tốt phía CV parsing. Cần bổ sung thêm cho phía scoring và interview:

**Index foreign key còn thiếu:**
```
cv_scores          → application_id
score_details      → cv_score_id
score_details      → scoring_rule_id
interview_answers  → question_id
interview_evaluations → answer_id
interview_reports  → session_id
```

**Composite index cho tìm kiếm ứng viên** (khi HR muốn lọc theo nhiều tiêu chí):
```
resume_skills      → (skill_name, proficiency_level)
                     → Tìm "Java ADVANCED" nhanh hơn nhiều lần

cv_scores          → (total_score DESC, scored_at)
                     → Xếp hạng CV theo điểm + thời gian

scoring_rules      → (is_active, version, company_id)
                     → Lấy quy tắc hiện hành của công ty
```

---

### 5.2 Normalize JSON thành bảng — Ưu tiên cao

Đây là thay đổi có tác động lớn nhất về mặt analytics.

**Bảng mới đề xuất: `cv_score_insights`**

Thay thế 3 cột JSON trong `cv_scores`:

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | BIGINT PK | |
| `cv_score_id` | BIGINT FK | Liên kết đến `cv_scores` |
| `type` | ENUM | `STRENGTH`, `WEAKNESS`, `ACTION` |
| `title` | VARCHAR(255) | Nội dung ngắn gọn |
| `description` | TEXT | Giải thích chi tiết (nếu có) |
| `priority` | TINYINT | 1 = cao nhất, 5 = thấp nhất |
| `display_order` | INT | Thứ tự hiển thị |

**Bảng mới đề xuất: `interview_insights`**

Thay thế 2 cột JSON trong `interview_reports`:

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | BIGINT PK | |
| `report_id` | BIGINT FK | Liên kết đến `interview_reports` |
| `type` | ENUM | `STRENGTH`, `WEAKNESS` |
| `title` | VARCHAR(255) | Nội dung ngắn gọn |
| `description` | TEXT | |
| `display_order` | INT | |

**Lợi ích sau khi normalize:**

Trước khi normalize — không thể làm:
- "Top 5 điểm yếu phổ biến nhất của ứng viên tháng 5?"
- "Tỉ lệ CV có điểm yếu về format vs về kỹ năng?"
- "Ứng viên nào vừa yếu cả CV lẫn phỏng vấn về cùng một điểm?"

Sau khi normalize — có thể làm dễ dàng bằng SQL thông thường.

---

### 5.3 Thêm Soft Delete

**Các bảng cần áp dụng trước:**
- `resumes` — dữ liệu gốc của ứng viên
- `applications` — đơn ứng tuyển kéo theo cv_scores và interview_sessions

**Cách hoạt động:**
Thêm 2 cột vào mỗi bảng:
- `deleted_at TIMESTAMP NULL` — null = chưa xóa, có giá trị = đã xóa lúc này
- `deleted_by BIGINT NULL` — ai đã thực hiện xóa

Tất cả query bình thường tự động lọc `WHERE deleted_at IS NULL`. Người dùng không thấy gì khác. Admin có thể xem và khôi phục nếu cần.

**Cleanup job:** Mỗi tháng xóa vĩnh viễn các record đã soft-delete quá 90 ngày — tránh phình to database.

---

### 5.4 Chuẩn hóa kiểu dữ liệu điểm số

**Bảng thay đổi đề xuất:**

| Cột | Hiện tại | Nên đổi thành | Lý do |
|---|---|---|---|
| `cv_scores.total_score` | `DOUBLE` | `DECIMAL(5,2)` | Chính xác tuyệt đối 0–100.00 |
| `cv_scores.stage*_score` | `DOUBLE` | `DECIMAL(5,2)` | Tương tự |
| `score_details.score` | `DOUBLE` | `DECIMAL(5,2)` | Tương tự |
| `score_details.max_score` | `DOUBLE` | `DECIMAL(5,2)` | Tương tự |
| `scoring_rules.max_score` | `DOUBLE` | `DECIMAL(5,2)` | Tương tự |
| `scoring_rules.weight` | `DOUBLE` | `DECIMAL(4,2)` | Trọng số 0.00–9.99 |
| `interview_reports.final_score` | `INT` | `DECIMAL(5,2)` | Nhất quán với CV score |
| `resume_educations.gpa` | `DOUBLE` | `DECIMAL(3,2)` | GPA 0.00–4.00 |
| `resume_skills.years_of_experience` | `DOUBLE` | `DECIMAL(4,1)` | 3.5 năm, 0.5 năm |

**Không cần đổi:**
- `interview_evaluations.score` (`INT` 1–10) — đây là điểm nguyên, không cần thập phân ✅
- `interview_reports.technical_score`, `communication_score`, `problem_solving_score` (`INT` 1–10) — tương tự ✅

---

### 5.5 Mã hóa dữ liệu cá nhân (PII Encryption)

**Các cột cần mã hóa trong `resume_basic_info`:**
- `email`
- `phone`
- `address`
- `date_of_birth`

**Cách hoạt động ở mức khái niệm:**
Tầng ứng dụng (Java) tự động mã hóa trước khi lưu vào DB và giải mã khi đọc ra. Database chỉ thấy chuỗi ký tự ngẫu nhiên — ngay cả người có quyền truy cập trực tiếp vào DB cũng không đọc được thông tin thật.

**Lưu ý kỹ thuật quan trọng cần nhớ:**
Phải dùng **IV (Initialization Vector) ngẫu nhiên và khác nhau cho mỗi lần mã hóa**, không phải một IV cố định cho tất cả. Nếu không, kẻ tấn công có thể suy ra pattern từ các giá trị mã hóa giống nhau.

**Hệ quả phụ cần xử lý:**
Sau khi mã hóa email, không thể query `WHERE email = 'abc@gmail.com'` nữa. Giải pháp là thêm cột `email_hash VARCHAR(64)` lưu SHA-256 của email — chỉ dùng để tìm kiếm và kiểm tra trùng lặp, không thể giải mã ngược.

---

### 5.6 Thêm Audit Fields

**Cần thêm vào tất cả bảng còn thiếu:**
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

**Bảng chính cần thêm thêm `created_by` và `updated_by`:**
- `resumes`
- `scoring_rules`
- `applications`

---

### 5.7 Bảng phụ trợ nên thêm (không bắt buộc ngay)

**`scoring_rule_versions`** — Lịch sử thay đổi quy tắc chấm điểm

Hiện tại khi quy tắc thay đổi, không biết CV cũ được chấm theo quy tắc nào. Bảng này lưu snapshot mỗi phiên bản quy tắc, giúp tái hiện lại lý do tại sao CV X được điểm Y vào thời điểm Z.

**`skill_taxonomy`** — Danh mục kỹ năng chuẩn

Hiện tại `skill_name` là chuỗi tự do — "JavaScript", "javascript", "JS", "js" là 4 giá trị khác nhau trong database nhưng cùng chỉ một kỹ năng. Bảng taxonomy cung cấp danh sách tên chuẩn và alias, giúp normalize skill name khi AI bóc tách.

---

## 6. Thứ tự ưu tiên thực hiện

### Giai đoạn A — Trước khi tiếp nhận dữ liệu thật (bắt buộc)

| # | Việc làm | Lý do cần ngay |
|---|---|---|
| 1 | Bổ sung index cho `cv_scores`, `score_details`, `interview_answers`, `interview_evaluations`, `interview_reports` | Trang chi tiết ứng viên sẽ chậm ngay khi có vài nghìn record |
| 2 | Mã hóa PII: `email`, `phone`, `address`, `date_of_birth` | Không thể thêm sau khi đã có dữ liệu thật mà không có migration phức tạp |
| 3 | Soft delete cho `resumes` và `applications` | Xóa nhầm là mất vĩnh viễn |
| 4 | Thêm `created_at`/`updated_at` cho các bảng còn thiếu | Cần để debug khi có sự cố sau này |

### Giai đoạn B — Trong 2–4 tuần sau launch

| # | Việc làm | Lý do |
|---|---|---|
| 5 | Tạo bảng `cv_score_insights` thay thế 3 cột JSON trong `cv_scores` | Cho phép analytics |
| 6 | Tạo bảng `interview_insights` thay thế 2 cột JSON trong `interview_reports` | Tương tự |
| 7 | Đổi tất cả `DOUBLE` sang `DECIMAL` cho điểm số | Tránh lỗi hiển thị kỳ lạ |
| 8 | Composite index cho skill search | Khi số lượng ứng viên tăng |
| 9 | Chuẩn hóa `predicted_level` về ENUM hoặc validation ở service | Dữ liệu nhất quán |

### Giai đoạn C — 1–2 tháng sau (hoàn thiện hệ thống)

| # | Việc làm | Lý do |
|---|---|---|
| 10 | Chính sách xóa `raw_ai_response` sau 30–90 ngày | Kiểm soát kích thước database |
| 11 | Bảng `scoring_rule_versions` | Lịch sử audit quy tắc chấm |
| 12 | Bảng `skill_taxonomy` | Normalize tên kỹ năng |
| 13 | GDPR consent management tables | Tuân thủ pháp lý đầy đủ |

---

## Tóm tắt nhanh

| Hạng mục | Trạng thái |
|---|---|
| Kiến trúc tổng thể (3NF, phân hệ) | ✅ Tốt, giữ nguyên |
| Index phía CV parsing | ✅ Đã hoàn thiện ở Giai đoạn 4 |
| Index phía CV scoring & interview | ❌ Chưa có — cần bổ sung |
| Kiểu dữ liệu điểm số | ⚠️ DOUBLE cần đổi sang DECIMAL |
| JSON trong cv_scores và interview_reports | ❌ Còn tồn tại — cần normalize |
| Soft delete | ❌ Chưa có |
| Mã hóa PII | ❌ Chưa có |
| Audit fields (created_at, updated_at) | ⚠️ Thiếu ở nhiều bảng |
| GDPR compliance | ❌ Chưa có |

---

*Review bởi Claude · Dựa trên AI_Hire_Database_Specs.md phiên bản cập nhật (4 giai đoạn)*
