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

---

## ✨ Tính năng mới — Score Gap Feedback (gộp vào JSON hiện tại)

### Mục tiêu
Thay vì chỉ chấm điểm, hệ thống chỉ ra **chính xác mục nào đang bị thiếu điểm** và **cần làm gì ngắn gọn** để cải thiện — như một coach cá nhân cho từng CV.

### Thiết kế JSON field mới

Thêm field `score_gaps` vào cuối JSON, **sau** `priority_actions`:

```json
"score_gaps": [
  {
    "section": "<Tên mục bị thiếu điểm, ví dụ: Quantification>",
    "current": <Điểm hiện tại của sub-item đó>,
    "max": <Điểm tối đa của sub-item đó>,
    "lost": <Số điểm đang bị mất = max - current>,
    "tip": "<Gợi ý ngắn 1 câu để lấy lại điểm>"
  }
]
```

> **Quy tắc lọc:** Chỉ đưa vào `score_gaps` những sub-item có `current < max * 0.7` (tức là đạt dưới 70% điểm tối đa). Không liệt kê mục đã gần đủ điểm — tránh overwhelm người dùng.

### Cách thêm vào prompt (Java)

Thêm đoạn sau vào cuối chuỗi JSON schema trong `promptText`, ngay trước dòng đóng `}` cuối cùng:

```java
// Thêm vào sau dòng "  \"priority_actions\": [...]"
"  \"score_gaps\": [\n" +
"    {\n" +
"      \"section\": \"<Tên sub-item bị thiếu điểm>\",\n" +
"      \"current\": <Điểm hiện tại>,\n" +
"      \"max\": <Điểm tối đa của sub-item>,\n" +
"      \"lost\": <max - current>,\n" +
"      \"tip\": \"<Gợi ý 1 câu ngắn gọn, cụ thể, khả thi để cải thiện>\"\n" +
"    }\n" +
"  ]\n" +
"  // Chỉ liệt kê sub-item có current < max * 0.7. Sắp xếp theo 'lost' giảm dần (thiếu nhiều nhất lên đầu).\n"
```

### Ví dụ output mẫu

```json
"score_gaps": [
  {
    "section": "Quantification",
    "current": 3,
    "max": 8,
    "lost": 5,
    "tip": "Thêm con số cụ thể vào mỗi bullet: doanh thu tăng bao nhiêu %, tiết kiệm bao nhiêu giờ/tháng."
  },
  {
    "section": "Summary",
    "current": 2,
    "max": 5,
    "lost": 3,
    "tip": "Viết lại mục tiêu nghề nghiệp: nêu rõ vị trí muốn ứng tuyển, số năm kinh nghiệm và giá trị bạn mang lại."
  },
  {
    "section": "Projects",
    "current": 1,
    "max": 5,
    "lost": 4,
    "tip": "Mô tả 1-2 dự án nổi bật: công nghệ dùng, vai trò của bạn và kết quả đạt được."
  }
]
```

### Lưu ý khi render ở Frontend

- Sắp xếp theo `lost` giảm dần → mục thiếu nhiều điểm nhất hiển thị trước
- Hiển thị progress bar: `current / max` cho mỗi dòng để người dùng thấy trực quan
- Tổng điểm có thể lấy lại = `sum(lost)` → hiển thị dạng *"Bạn có thể cải thiện thêm tối đa +18 điểm"*
- Giới hạn tối đa **5 mục** trong `score_gaps` — nếu AI trả về nhiều hơn thì chỉ render 5 mục đầu (thiếu nhiều nhất)

---

## 🖥️ Tính năng mới — Inline Tip ngay trong UI Chi tiết điểm

### Vấn đề với UI hiện tại

Trong màn hình "Chi tiết điểm ATS", mỗi sub-item (File Technical, ATS Parsability, Typography, Length...) hiện chỉ hiển thị tên + điểm badge + description + progress bar. Với sub-item **chưa đủ điểm** (ví dụ ATS Parsability 6/8, Typography 2/4), người dùng không biết cần làm gì tiếp theo ngay tại chỗ đó.

### Giải pháp — Thêm field `sub_tips` vào JSON

Thêm 1 field `sub_tips` song song vào JSON output, nhúng tip trực tiếp vào từng sub-item:

```java
// Thêm vào promptText sau phần stage4_bonus, trước priority_actions:
"  \"sub_tips\": {\n" +
"    \"<tên_sub_item_snake_case>\": \"<tip ngắn nếu điểm < 70% tối đa, null nếu đã đạt>\"\n" +
"  },\n" +
"  // Quy tắc:\n" +
"  // - Key dùng snake_case, map 1-1 với sub-item trong details (vd: ats_parsability, typography, quantification)\n" +
"  // - Chỉ sinh tip cho sub-item có current < max * 0.7. Các sub-item đủ điểm để null.\n" +
"  // - Tip tối đa 15 từ, bắt đầu bằng động từ hành động, nêu việc cụ thể cần làm.\n"
```

### Cấu trúc JSON mẫu — `sub_tips`

```json
"sub_tips": {
  "file_technical": null,
  "ats_parsability": "Thêm header chuẩn: 'Work Experience', 'Education', 'Skills' để máy đọc nhận diện.",
  "typography": "Dùng 1 font duy nhất (Arial/Calibri), căn lề trái, cỡ chữ 10–12pt.",
  "length": "Rút gọn CV xuống còn 1 trang — bỏ thông tin không liên quan đến vị trí ứng tuyển.",
  "quantification": "Thêm số liệu vào mỗi bullet: %, số người quản lý, thời gian tiết kiệm.",
  "bullet_quality": null,
  "progression": null
}
```

### Cách render trong UI — đúng với màn hình hiện tại

```
┌──────────────────────────────────────────────────────────┐
│  ATS Parsability   +6/8              ████████░░░░░░░░    │
│  Cấu trúc phân mục rõ ràng, dễ đọc                      │
│  💡 Thêm header chuẩn: 'Work Experience', 'Education'   │  ← Hiện khi tip != null
│     để máy đọc nhận diện tốt hơn.                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  File Technical    +5/5              ████████████████    │
│  PDF định dạng chuẩn, sạch                               │
│  (không có dòng tip)                                     │  ← Ẩn khi tip == null
└──────────────────────────────────────────────────────────┘
```

### Logic hiển thị Frontend

```javascript
// Với mỗi sub-item, lookup key tương ứng từ sub_tips
const tip = data.sub_tips?.[subItemKey]; // vd: sub_tips["ats_parsability"]

// Chỉ render dòng tip khi có giá trị
if (tip) {
  renderTipRow(`💡 ${tip}`);
}
```

### Màu badge theo % điểm — áp dụng luôn cho UI hiện tại

| Tỉ lệ `current / max` | Màu badge | Hiển thị tip? |
|---|---|---|
| ≥ 90% | 🟢 Xanh lá | Không |
| 70–89% | 🟡 Vàng nhạt | Không (gần đủ rồi) |
| 50–69% | 🟠 Cam | **Có** |
| < 50% | 🔴 Đỏ | **Có** — ưu tiên cao |

> Threshold 70% nhất quán với `score_gaps` — chỉ show tip khi thực sự cần, không spam gợi ý ở những mục đã tốt.

### Tổng hợp — 2 field bổ trợ nhau

| Field | Dùng ở đâu | Mục đích |
|---|---|---|
| `sub_tips` | Màn hình Chi tiết điểm | Tip inline ngay dưới từng sub-item bị thiếu |
| `score_gaps` | Banner/Card tổng hợp | Top 5 mục thiếu nhiều nhất + tổng điểm có thể cải thiện |
