# 🎯 Senior Review — Cơ Chế Chấm Điểm CV (AI-Hires Scoring Engine)

> **Góc nhìn:** Senior đã build các hệ thống AI-assisted scoring, ATS parser, và candidate matching trong nhiều năm.  
> **Kết luận nhanh:** Thiết kế thang điểm có tư duy tốt, nhưng còn một số vấn đề về tính công bằng, khả năng mở rộng, và độ tin cậy của AI output mà nếu không xử lý sẽ ảnh hưởng trực tiếp đến giá trị sản phẩm với người dùng thật.

---

## I. Điểm Mạnh Cần Ghi Nhận ✅

| # | Điểm tốt | Lý do đáng ghi nhận |
|---|---|---|
| 1 | **"No Grade Inflation" là cam kết đúng** | Phần lớn ATS checker thị trường chấm 80–90 điểm để làm user vui → không có giá trị thật. Cam kết khắt khe tạo ra sự khác biệt |
| 2 | **Tách biệt 2 luồng JSON** (scoring vs normalized profile) | Thiết kế sạch, đúng single-responsibility — dữ liệu chấm điểm và dữ liệu profile phục vụ 2 use case hoàn toàn khác nhau |
| 3 | **Quantification (8đ) được trọng số cao nhất** trong content_quality | Đây là tiêu chí phân biệt CV trung bình và CV tốt rõ nhất — quyết định đúng |
| 4 | **scan_actions phân cấp ưu tiên HIGH/MED/LOW** | User biết làm gì trước, không bị overwhelmed bởi danh sách todo dài |
| 5 | **Stage 4 Bonus theo ngành** (category_specific) | Ý tưởng hay — IT cần GitHub, Design cần Behance. Tránh đánh đồng mọi ngành |

---

## II. Các Vấn Đề Cần Xem Xét

---

### 🔴 Vấn đề 1 — Trọng số không tuyến tính với giá trị tuyển dụng thực tế

**Phân tích phân bổ điểm hiện tại:**

```
Stage 2 — Core Foundations:   60 điểm (60%)
Stage 3 — In-depth Evidence:  30 điểm (30%)
Stage 4 — Bonus:              10 điểm (10%)
```

**Vấn đề cụ thể:**

Trong Stage 2, `ats_format` chiếm 20/60 điểm — **bằng** `professional_foundation` và **bằng** `content_quality`. Nhưng nhìn vào thực tế tuyển dụng:

> Một CV có format đẹp nhưng nội dung rỗng sẽ bị loại ngay vòng 1.  
> Một CV format tệ nhưng nội dung xuất sắc vẫn được gọi phỏng vấn.

Hiện tại, một ứng viên có thể đạt **50/100 điểm** chỉ bằng cách format CV đúng chuẩn ATS mà không cần có kinh nghiệm thực chất nào. Điều này làm giảm giá trị discriminatory power của thang điểm.

**Ví dụ minh họa vấn đề:**

```
Ứng viên A — CV đẹp, format hoàn hảo, nội dung sơ sài:
  ats_format:              19/20  ✓
  professional_foundation: 18/20  ✓
  content_quality:          8/20  (thiếu số liệu, từ khóa chung chung)
  experience_eval:          6/15  (1 năm kinh nghiệm, không có depth)
  technical_evidence:       3/8   (liệt kê tool, không có proof)
  → Tổng: 54/100

Ứng viên B — CV format thường, nội dung xuất sắc:
  ats_format:              12/20  (hơi đông, margin nhỏ)
  professional_foundation: 15/20
  content_quality:         18/20  (rất nhiều số liệu, từ khóa tốt)
  experience_eval:         14/15  (7 năm, thăng tiến rõ, impact lớn)
  technical_evidence:       7/8   (GitHub, paper, contribution)
  → Tổng: 66/100
```

Chênh lệch chỉ 12 điểm dù Ứng viên B vượt trội hoàn toàn. **Thang điểm không phân biệt đủ rõ.**

**Hướng cải thiện — Rebalance trọng số:**

```
TRƯỚC:                    SAU ĐỀ XUẤT:
Stage 2: 60đ  (60%)  →   Stage 2: 50đ  (50%)
  ats_format:    20đ  →     ats_format:    12đ  (-8đ)  ← Giảm mạnh
  pro_foundation: 20đ →     pro_foundation: 18đ  (-2đ)
  content_quality: 20đ →    content_quality: 20đ  (giữ)

Stage 3: 30đ  (30%)  →   Stage 3: 40đ  (40%)  ← Tăng mạnh
  experience_eval: 15đ →    experience_eval: 20đ  (+5đ)
  technical_evidence: 8đ →  technical_evidence: 10đ  (+2đ)
  projects:        5đ  →    projects:         7đ  (+2đ)
  certs:           2đ  →    certs:            3đ  (+1đ)

Stage 4: 10đ  (10%)  →   Stage 4: 10đ  (giữ nguyên)
```

**Lý do:** ATS format là threshold (đạt/không đạt), không phải differentiator. Khi format đủ chuẩn, điểm thêm từ format đẹp hơn không có giá trị tuyển dụng thực tế bằng depth của kinh nghiệm.

---

### 🔴 Vấn đề 2 — Không có cơ chế kiểm soát tính ổn định của Gemini output

**Vấn đề cốt lõi:**

Cùng một CV, Gemini có thể trả về điểm khác nhau giữa các lần gọi. Đây là **vấn đề nền tảng** của mọi hệ thống dùng LLM để chấm điểm, không phải lỗi thiết kế — nhưng không xử lý thì hệ thống mất tín nhiệm.

**Tình huống xảy ra:**
- User quét CV → 65 điểm
- User sửa đúng 1 dòng nhỏ → upload lại → 72 điểm (tăng 7 điểm chỉ vì Gemini "hứng" khác)
- User quét lại CV cũ (bỏ qua cache vì hash khác) → 60 điểm
- User mất tin vào hệ thống

**Đo lường vấn đề trước khi fix:**

```python
# Bước 1: Benchmark stability trước
def measure_scoring_variance(cv_text: str, n_runs: int = 10):
    scores = []
    for _ in range(n_runs):
        result = call_gemini_scoring(cv_text)
        scores.append(result['total_score'])

    return {
        "mean": statistics.mean(scores),
        "std_dev": statistics.stdev(scores),
        "min": min(scores),
        "max": max(scores),
        "variance_range": max(scores) - min(scores)
    }

# Acceptable: std_dev < 3, variance_range < 8
# Cần xử lý: std_dev > 5, variance_range > 12
```

**Hướng cải thiện — Multi-sample consensus:**

```python
async def score_cv_stable(cv_text: str) -> ScoringResult:
    """
    Gọi Gemini 3 lần, lấy median thay vì giá trị đơn.
    Chi phí: gấp 3 lần — nhưng chỉ áp dụng cho lần đầu scan (cache hit bypass).
    """
    SAMPLE_COUNT = 3

    tasks = [call_gemini_scoring(cv_text) for _ in range(SAMPLE_COUNT)]
    results = await asyncio.gather(*tasks)

    # Lấy median của total_score
    scores_sorted = sorted(results, key=lambda r: r['total_score'])
    median_result = scores_sorted[SAMPLE_COUNT // 2]

    # Nếu variance quá cao → flag để review thủ công
    score_range = scores_sorted[-1]['total_score'] - scores_sorted[0]['total_score']
    if score_range > 10:
        flag_for_manual_review(median_result, results)

    median_result['confidence'] = calculate_confidence(results)
    return median_result
```

**Thêm temperature control vào Gemini prompt:**

```python
generation_config = {
    "temperature": 0.1,      # Giảm xuống mức thấp nhất có thể
    "top_p": 0.8,
    "top_k": 20,
}
# Temperature thấp → output ổn định hơn, ít sáng tạo hơn
# Phù hợp với scoring task (muốn nhất quán, không cần sáng tạo)
```

---

### 🔴 Vấn đề 3 — `certs` chỉ có 2 điểm: quá thấp, sai giá trị thực

**Phân bổ hiện tại:**
```
certs (Bằng cấp & Chứng chỉ): 2/100 điểm
```

**Vấn đề:** 2 điểm = Gemini có thể cho 0, 1, hoặc 2. Thực tế:
- AWS Solutions Architect + CKA + Google Cloud cert vs không có cert nào → chỉ chênh nhau 2 điểm
- PhD Computer Science vs chưa tốt nghiệp đại học → ảnh hưởng chỉ 2 điểm

Quan trọng hơn: **2 điểm quá thô để phân biệt**. Với chỉ 3 mức (0, 1, 2), Gemini không thể express được sự khác biệt giữa "chứng chỉ không liên quan" vs "chứng chỉ liên quan nhưng hết hạn" vs "chứng chỉ liên quan còn hiệu lực" vs "chứng chỉ tier-1 của ngành".

**Hướng cải thiện:**

Tách `certs` thành 2 phần rõ ràng hơn:

```
TRƯỚC:
  certs: 2đ (gộp bằng cấp + chứng chỉ)

SAU:
  academic_credentials: 4đ
    - Bằng cấp phù hợp với vị trí (Đại học, Thạc sĩ, Tiến sĩ)
    - GPA (nếu < 3 năm kinh nghiệm)
    
  professional_certs: 4đ (tăng từ 2đ)
    - Số lượng và độ liên quan chứng chỉ
    - Tier của chứng chỉ (Google/AWS/Microsoft tier-1 > generic cert)
    - Còn hiệu lực hay hết hạn
```

---

### 🟡 Vấn đề 4 — Thang điểm không điều chỉnh theo level/ngành: thiếu công bằng

**Vấn đề:**

Cùng một thang điểm áp dụng cho Intern và Senior là **không công bằng về mặt logic**:

```
Tiêu chí: Quantification (8đ)
  - Intern 1 năm: "Hoàn thành 3 tính năng đúng deadline" → Gemini cho 3/8
  - Senior 10 năm: "Tăng conversion rate 35%, giảm churn 20%" → Gemini cho 7/8

Câu hỏi: Intern đó có phải là CV kém không?
→ Không. Họ không có số liệu để quantify vì chưa có cơ hội.
→ Nhưng thang điểm cùng max = 8đ, Intern luôn thua.
```

**Hệ quả:** Mọi Intern và Fresher đều có điểm thấp vì tiêu chí được thiết kế cho Senior. Điều này làm mất giá trị sản phẩm với 40–50% user base (juniors, freshers).

**Hướng cải thiện — Level-adjusted scoring:**

```python
SCORING_WEIGHTS_BY_LEVEL = {
    "INTERN": {
        "quantification": {
            "max_score": 8,
            "description": "Ở level Intern, đánh giá theo tiềm năng học hỏi và mô tả công việc có cấu trúc. Không yêu cầu số liệu kinh doanh cụ thể."
        },
        "experience_eval": {
            "max_score": 15,
            "scope_impact_note": "Thay thế Scope & Impact bằng Project Quality và Learning Attitude cho Intern"
        }
    },
    "FRESHER": { ... },
    "SENIOR": { ... }
}

# Inject vào prompt:
def build_scoring_prompt(cv_text: str, detected_level: str) -> str:
    level_context = SCORING_WEIGHTS_BY_LEVEL[detected_level]
    return f"""
    Ứng viên này được AI detect là level: {detected_level}

    Điều chỉnh tiêu chí chấm điểm theo level:
    {json.dumps(level_context, ensure_ascii=False)}

    Lưu ý: Đây là level-adjusted scoring.
    Điểm 75/100 của một Intern xuất sắc KHÔNG so sánh được với 75/100 của một Senior.
    """
```

---

### 🟡 Vấn đề 5 — `details` trong sub-score là free-text: khó parse và không nhất quán

**Cấu trúc hiện tại trong JSON:**
```json
"ats_format": {
  "details": [
    "File định dạng PDF chuẩn +10/10",
    "Dữ liệu dạng bảng phức tạp ảnh hưởng máy đọc +8/10"
  ]
}
```

**Vấn đề:** Điểm số nhúng trong free-text → phải dùng regex để extract. Khi Gemini đổi format:
- `"+8/10"` → `"đạt 8 trên 10 điểm"` → `"8đ/10đ"` → regex fail

Trong production, regex fail rate với LLM output thường là **5–15%** — có nghĩa cứ 10–20 lần scan sẽ có 1 lần parse điểm sai hoặc thiếu.

**Hướng cải thiện — Strict structured output:**

```
Thêm vào prompt:
"Với MỖI tiêu chí phụ, bắt buộc trả về object JSON có đúng 4 trường:
{
  'key': string,      // section_key cố định, không được thay đổi
  'score': integer,   // điểm đạt được, chỉ là số nguyên
  'max': integer,     // điểm tối đa, chỉ là số nguyên
  'reason': string    // lý do nhận xét, không chứa điểm số
}
TUYỆT ĐỐI không nhúng điểm số vào trường 'reason'."
```

```json
// SAU KHI FIX:
"ats_format": {
  "sub_scores": [
    { "key": "file_technical",  "score": 5,  "max": 5,  "reason": "Định dạng PDF chuẩn, không dùng bảng phức tạp" },
    { "key": "ats_parsability", "score": 6,  "max": 8,  "reason": "Cấu trúc khá rõ nhưng header dùng text box khó parse" },
    { "key": "typography",      "score": 4,  "max": 4,  "reason": "Font và khoảng cách nhất quán" },
    { "key": "length",          "score": 2,  "max": 3,  "reason": "CV dài 2 trang, hơi nhiều với 2 năm kinh nghiệm" }
  ]
}
```

---

### 🟡 Vấn đề 6 — Không có tầng validation điểm: Gemini có thể trả về số vô lý

**Tình huống thực tế hay gặp với LLM:**
```json
// Gemini trả về — hoàn toàn có thể xảy ra:
{ "key": "quantification", "score": 9, "max": 8 }   // score > max
{ "key": "ats_parsability", "score": -1, "max": 8 }  // score âm
{ "key": "bullet_quality", "score": 6.5, "max": 6 }  // không nguyên, vượt max
// Tổng stage2 trong JSON: 65, nhưng tổng thực tế các sub: 58 → lệch nhau
```

**Hướng cải thiện — Validation layer bắt buộc:**

```java
public class ScoringResultValidator {

    public void validate(ScoringResult result) {
        // 1. Score không âm và không vượt max
        for (SubScore sub : result.getSubScores()) {
            if (sub.getScore() < 0 || sub.getScore() > sub.getMaxScore()) {
                throw new InvalidScoringDataException(
                    String.format("Sub-score '%s': score=%d vượt ngoài [0, %d]",
                        sub.getKey(), sub.getScore(), sub.getMaxScore())
                );
            }
        }

        // 2. Tổng sub-scores phải khớp với stage score
        int calculatedStage2 = sumSubScores(result, STAGE2_KEYS);
        if (Math.abs(calculatedStage2 - result.getStage2Score()) > 1) {
            // Tự tính lại thay vì tin vào Gemini
            result.setStage2Score(calculatedStage2);
            log.warn("Stage2 score mismatch: Gemini={}, Calculated={}",
                result.getStage2Score(), calculatedStage2);
        }

        // 3. Total phải bằng tổng các stages
        int expectedTotal = calculatedStage2
            + sumSubScores(result, STAGE3_KEYS)
            + sumSubScores(result, STAGE4_KEYS);
        result.setTotalScore(expectedTotal);  // Luôn tự tính, không tin Gemini
    }
}
```

**Nguyên tắc:** **Không bao giờ dùng `total_score` từ Gemini trực tiếp.** Luôn tự tính tổng từ sub-scores ở application layer.

---

### 🟡 Vấn đề 7 — Stage 4 Bonus: tiêu chí mơ hồ, Gemini khó chấm nhất quán

**Các tiêu chí Stage 4:**
```
Leadership (2đ), International (2đ), Awards (2đ), Learning (2đ), Category-Specific (2đ)
```

**Vấn đề — thiếu rubric cụ thể:**

Không có rubric → Gemini tự diễn giải → kết quả không nhất quán:

```
"Từng làm Team Leader 3 người trong 1 tháng" → Leadership: 1 hay 2?
"Biết tiếng Anh B2" → International: 0 hay 1 hay 2?
"Học 1 khóa Udemy mỗi năm" → Learning: 1 hay 2?
```

Không có câu trả lời đúng → variance cao nhất ở Stage 4.

**Hướng cải thiện — Rubric chi tiết trong prompt:**

```
Stage 4 Bonus Scoring Rubric (ĐÂY LÀ QUY TẮC BẮT BUỘC):

Leadership (max 2đ):
  0đ — Không có dấu hiệu lãnh đạo
  1đ — Có đề cập mentor/lead nhưng không rõ quy mô (< 5 người, < 6 tháng)
  2đ — Lãnh đạo rõ ràng: team ≥ 5 người HOẶC thời gian ≥ 6 tháng HOẶC cấp Trưởng nhóm trở lên

International (max 2đ):
  0đ — Chỉ làm việc trong nước, tiếng Anh ở mức cơ bản
  1đ — Tiếng Anh IELTS 6.5+ / TOEIC 750+ HOẶC từng làm việc với team nước ngoài
  2đ — Làm việc tại công ty nước ngoài HOẶC IELTS 7.0+ HOẶC native-level ngoại ngữ 2

Learning (max 2đ):
  0đ — Không có bằng chứng tự học
  1đ — Có 1–2 chứng chỉ online HOẶC đề cập học công nghệ mới
  2đ — Chuỗi chứng chỉ liên tục HOẶC contribute open source HOẶC viết blog kỹ thuật

[Tương tự cho Awards và Category-Specific]
```

---

### 🟡 Vấn đề 8 — Không có cơ chế phát hiện CV "gian lận điểm số"

**Vấn đề:** Một số user biết hệ thống chấm dựa trên text → thêm từ khóa ảo, số liệu bịa vào CV chỉ để tăng điểm → điểm cao nhưng CV vô nghĩa với nhà tuyển dụng.

**Ví dụ:**
```
Thực tế: "Làm việc tại startup nhỏ 5 người"
Gian lận: "Lãnh đạo team 15 kỹ sư, tăng revenue 300%, giảm bug 80%,
           được trao giải nhân viên xuất sắc 3 năm liên tiếp"
→ Điểm tăng từ 55 → 85
```

**Hướng cải thiện — Credibility scoring:**

```
Thêm vào prompt:
"Bên cạnh điểm ATS, hãy đánh giá Credibility Score (0–10) cho từng achievement:
  - Các số liệu có vẻ hợp lý với quy mô công ty không?
  - Các thành tích có consistent với level và thời gian làm việc không?
  - Có dấu hiệu nào của keyword stuffing không?

Nếu Credibility Score < 6, giảm tổng điểm ATS xuống 10–15%.
Ghi rõ lý do trong trường 'credibility_warning'."
```

```json
// Output khi phát hiện bất thường:
{
  "credibility_score": 4,
  "credibility_warning": "Ứng viên 1 năm kinh nghiệm nhưng khai 'quản lý 20 kỹ sư' và 'tăng doanh thu 500%' — không hợp lý với cấp độ Fresher.",
  "adjusted_total_score": 52,   // Sau khi apply penalty
  "raw_total_score": 68         // Trước penalty
}
```

---

### 🟣 Vấn đề 9 — Thiếu score versioning: không thể so sánh điểm theo thời gian

**Vấn đề:** Khi thay đổi trọng số (ví dụ rebalance theo Vấn đề 1), điểm cũ và điểm mới không thể so sánh được:

```
Tháng 1: User đạt 65/100 (với scoring_version = v1.0)
Tháng 3: Thay đổi trọng số → User scan lại → 70/100 (scoring_version = v2.0)
Hệ thống hiện tại: Cả 2 đều lưu cùng bảng, không phân biệt → "Điểm tôi tăng 5 điểm" — nhưng thực ra là do thay đổi thang điểm
```

**Hướng cải thiện:**
```sql
ALTER TABLE resume_scans
  ADD COLUMN scoring_version VARCHAR(10) DEFAULT 'v1.0',
  ADD COLUMN scoring_config_hash VARCHAR(64);
  -- Hash của prompt + weight config tại thời điểm scan

-- Khi so sánh điểm theo thời gian:
SELECT * FROM resume_scans
WHERE user_id = ?
  AND scoring_version = 'v1.0'  -- Chỉ so sánh cùng version
ORDER BY scanned_at DESC;
```

---

### 🟣 Vấn đề 10 — Thiếu cơ chế feedback loop để cải thiện prompt

**Vấn đề:** Hệ thống hiện tại chỉ chạy một chiều: CV → Gemini → Điểm. Không có vòng phản hồi để biết chấm đúng không.

**Hướng cải thiện — Thu thập implicit feedback:**

```
Tín hiệu có thể thu thập:
1. User sửa CV theo recommendation → scan lại → điểm GIẢM → recommendation sai
2. User rate: "Nhận xét này có hữu ích không?" (thumbs up/down per sub-score)
3. User bỏ qua action HIGH priority → có thể action đó sai ngữ cảnh
4. Employer filter loại bỏ ứng viên điểm 80+ → calibration vấn đề
```

```sql
CREATE TABLE scoring_feedback (
  id              BIGINT PRIMARY KEY,
  scan_id         BIGINT REFERENCES resume_scans(id),
  section_key     VARCHAR(50),
  feedback_type   ENUM('helpful', 'not_helpful', 'wrong'),
  user_comment    TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Aggregate theo section_key để phát hiện sub-score nào hay bị rate 'wrong'
-- → Cải thiện prompt cho section đó
```

---

## III. Đánh Giá Tổng Thể

### Scorecard

| Hạng mục | Điểm hiện tại | Sau khi fix | Ghi chú |
|---|---|---|---|
| Tính công bằng theo level | 5/10 | 8/10 | Level-adjusted scoring |
| Độ ổn định output AI | 5/10 | 8/10 | Multi-sample + temperature control |
| Độ tin cậy dữ liệu | 6/10 | 9/10 | Validation layer + tự tính tổng |
| Granularity của feedback | 7/10 | 9/10 | Structured sub-score JSON |
| Khả năng chống gian lận | 3/10 | 7/10 | Credibility scoring |
| Khả năng cải thiện theo thời gian | 3/10 | 8/10 | Versioning + feedback loop |
| **Tổng thể** | **5/10** | **8.5/10** | |

---

## IV. Lộ Trình Thực Hiện

### Sprint 1 — Fix nền tảng trước khi launch (3–4 ngày)

- [ ] **Vấn đề 5**: Refactor JSON output → structured sub-score (fix parse reliability)
- [ ] **Vấn đề 6**: Implement validation layer — luôn tự tính tổng, không tin Gemini
- [ ] **Vấn đề 2**: Thêm `temperature: 0.1` vào Gemini config, đo variance trước/sau

### Sprint 2 — Nâng cao chất lượng chấm (1 tuần)

- [ ] **Vấn đề 1**: Rebalance trọng số Stage 2 (ats_format ↓) và Stage 3 (experience ↑)
- [ ] **Vấn đề 7**: Viết rubric chi tiết cho Stage 4 Bonus vào prompt
- [ ] **Vấn đề 3**: Tách `certs` thành `academic_credentials` + `professional_certs`

### Sprint 3 — Features nâng cao (2+ tuần)

- [ ] **Vấn đề 4**: Level-adjusted scoring (Intern/Fresher/Junior/Senior có prompt khác nhau)
- [ ] **Vấn đề 8**: Credibility scoring cho phát hiện keyword stuffing
- [ ] **Vấn đề 9**: Thêm `scoring_version` vào DB để track thay đổi thang điểm
- [ ] **Vấn đề 10**: Feedback loop — thu thập rating per sub-score

---

## V. Nhận Xét Cuối

> Thang điểm hiện tại có **khung tư duy đúng**: tách format vs content vs depth, bonus theo ngành, không grade inflation. Đây là nền tảng tốt hơn 80% các ATS checker ngoài thị trường.
>
> Rủi ro lớn nhất không phải là thiết kế sai — mà là **tin tưởng quá nhiều vào output của Gemini** mà không có tầng kiểm soát phía dưới. LLM về bản chất là không deterministic. Hệ thống scoring cần deterministic ở output, nên mọi số liệu từ Gemini đều phải đi qua validation trước khi lưu DB và hiển thị cho user.
>
> Fix **Vấn đề 5** (structured JSON) và **Vấn đề 6** (validation layer) trước — đây là 2 thứ nếu thiếu sẽ tạo ra data corruption âm thầm mà khó phát hiện cho đến khi user report.
