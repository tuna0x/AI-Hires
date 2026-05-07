# Phân tích & Hướng dẫn sửa ATS Prompt (Gemini Multimodal)

## Tổng quan

Prompt hiện tại có cấu trúc tốt, hỗ trợ multimodal và bilingual. Tuy nhiên có **1 lỗi nghiêm trọng về cộng điểm** và **3 vấn đề ảnh hưởng chất lượng output** cần sửa trước khi production.

---

## 🔴 Lỗi 1 — Cộng điểm sai ở `content_quality` (Stage 2)

### Vấn đề
`content_quality` được ghi "Tối đa 20" nhưng các sub-items chỉ cộng lại được **16**:

```
Language:        +điểm/5
Quantification:  +điểm/8
Consistency:     +điểm/3
─────────────────────────
Tổng thực tế:        16  ← Thiếu 4 điểm so với tối đa 20
```

Hệ quả: Gemini sẽ trả về `score` của `content_quality` không khớp với tổng `details`, gây ra `stage2_core.score` sai → `total_score` sai.

### Cách sửa
Thêm sub-item thứ 4 vào mảng `details` của `content_quality`:

```java
// Thay đoạn content_quality.details hiện tại bằng:
"\"details\": [\n" +
"  \"Language: +<điểm>/5 (Ngữ pháp, động từ mạnh, từ vựng chuyên ngành)\",\n" +
"  \"Quantification: +<điểm>/8 (Sử dụng số liệu định lượng, kết quả cụ thể)\",\n" +
"  \"Consistency: +<điểm>/3 (Tính nhất quán về ngày tháng, format)\",\n" +
"  \"Action Verbs & Tone: +<điểm>/4 (Dùng động từ hành động mạnh, tránh passive voice, ngôn ngữ chuyên nghiệp, tự tin)\"\n" +
"]\n"
```

> **Kiểm tra lại sau khi sửa:** 5+8+3+4 = **20** ✓

---

## 🔴 Lỗi 2 — Thiếu công thức tính `total_score`

### Vấn đề
Prompt không chỉ định cách tính `total_score`. Gemini sẽ tự ước lượng theo heuristic riêng, dẫn đến:
- `total_score` ≠ `stage2 + stage3 + stage4`
- Kết quả không nhất quán giữa các lần gọi

### Cách sửa
Thêm dòng hướng dẫn vào cuối phần mô tả `total_score` trong prompt:

```java
// Thay dòng:
"  \"total_score\": <Tổng điểm 0-100>,\n"

// Bằng:
"  \"total_score\": <Tổng điểm = stage2_core.score + stage3_in_depth.score + stage4_bonus.score>,\n"
```

---

## 🟡 Vấn đề 3 — Grade Inflation (Gemini cho điểm quá cao)

### Vấn đề
Không có calibration anchor khiến Gemini grade inflate — phần lớn CV trung bình sẽ nhận 75-85 điểm dù chất lượng thực tế kém. Người dùng mất niềm tin vào hệ thống chấm điểm.

### Cách sửa
Thêm đoạn calibration vào **đầu** của `promptText`, ngay sau phần giới thiệu vai trò:

```java
// Thêm vào sau dòng "Hệ thống phải xử lý mượt mà cả Tiếng Anh và Tiếng Việt.\n\n"
"THANG ĐIỂM THAM CHIẾU (bắt buộc tuân thủ, chấm NGHIÊM KHẮC):\n" +
"- 85-100: Xuất sắc — top 5% ứng viên, CV gần như hoàn hảo\n" +
"- 70-84 : Tốt — cạnh tranh được ở thị trường\n" +
"- 55-69 : Trung bình — cần cải thiện đáng kể\n" +
"- Dưới 55: Yếu — cần làm lại CV từ đầu\n" +
"Hầu hết CV thực tế nằm ở mức 45-70. Không grade inflate.\n\n"
```

---

## 🟡 Vấn đề 4 — `Category-Specific` trong Stage 4 quá mơ hồ

### Vấn đề
`"Category-Specific: +<điểm>/2"` — Gemini không biết tiêu chí này áp dụng như thế nào theo từng ngành, dẫn đến chấm điểm tùy tiện.

### Cách sửa
Thay thế placeholder bằng ví dụ cụ thể theo ngành:

```java
// Thay:
"\"Category-Specific: +<điểm>/2\"\n"

// Bằng:
"\"Category-Specific: +<điểm>/2 (Theo ngành: IT→GitHub/Portfolio/side project; " +
"Marketing→Case study/campaign result; Finance→CFA/CPA/số liệu P&L; " +
"Design→Behance/Dribbble link; Sales→Revenue quota attainment)\"\n"
```

---

## 💡 Cải thiện 5 — Xử lý JSON trả về an toàn hơn (Java)

### Vấn đề
`.replace("```json", "").replace("```", "")` không handle được trường hợp Gemini thêm text trước hoặc sau JSON object.

### Cách sửa

```java
// Thay đoạn xử lý response hiện tại:
return aiResultText.replace("```json", "").replace("```", "").trim();

// Bằng regex extract JSON object:
String cleaned = aiResultText.replace("```json", "").replace("```", "").trim();
java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{[\\s\\S]*\\}");
java.util.regex.Matcher matcher = pattern.matcher(cleaned);
if (matcher.find()) {
    return matcher.group();
}
throw new RuntimeException("Không tìm thấy JSON hợp lệ trong response của AI");
```

---

## ✅ Kiểm tra tổng điểm sau khi sửa

| Stage | Sub-items | Tối đa |
|---|---|---|
| Stage 2 — `ats_format` | 5+8+4+3 | 20 |
| Stage 2 — `professional_foundation` | 4+5+6+5 | 20 |
| Stage 2 — `content_quality` | 5+8+3+4 | **20** ✓ |
| **Stage 2 tổng** | | **60** |
| Stage 3 — `experience_eval` | 3+6+6 | 15 |
| Stage 3 — `technical_evidence` | 8 | 8 |
| Stage 3 — `projects` | 5 | 5 |
| Stage 3 — `certs` | 2 | 2 |
| **Stage 3 tổng** | | **30** |
| Stage 4 — `bonus` | 2+2+2+2+2 | 10 |
| **Tổng toàn bộ** | | **100** ✓ |

---

## Thứ tự ưu tiên sửa

1. **[Bắt buộc]** Sửa `content_quality` thêm sub-item 4 điểm → tránh bug tổng điểm
2. **[Bắt buộc]** Thêm công thức tính `total_score` → đảm bảo nhất quán
3. **[Khuyến nghị]** Thêm calibration anchor → chất lượng chấm điểm thực tế hơn
4. **[Khuyến nghị]** Làm rõ `Category-Specific` → giảm hallucination
5. **[Tùy chọn]** Dùng regex extract JSON → tăng độ bền xử lý response
