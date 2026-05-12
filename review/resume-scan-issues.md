# Resume Scan — Issues & Cải thiện

Date: 2026-05-12

---

## 1. Heuristic chọn vision vs text-only hay bị mis-route

**Vấn đề**
Logic `isTextCorrupted` chỉ kiểm tra `@` và regex `\d{9,11}`. Bỏ sót các trường hợp:
- CV 2 cột, Tika chỉ đọc được 1 cột → không có email/phone trong extracted text
- Số điện thoại quốc tế (`+84 xxx`) không match regex
- CV intern ngắn < 300 ký tự nhưng text vẫn sạch

**Cải thiện**
- Ưu tiên vision-first cho **mọi PDF** — layout/format signal chỉ có thể thấy qua vision
- Chỉ dùng text-only cho DOCX mà Tika extract sạch, không lỗi
- Loại bỏ heuristic dựa trên email/phone vì quá brittle

---

## 2. Positional array mapping dễ gây silent data corruption

**Vấn đề**
`ScanMapperService` map `details` array theo thứ tự vị trí (item 0 = section A, item 1 = section B...). Nếu Gemini bỏ sót 1 item, swap thứ tự, hoặc thêm item ngoài dự kiến → sub-scores bị lệch toàn bộ mà không có lỗi nào được throw.

**Cải thiện**
- Chuyển sang key-based mapping thay vì positional
- Enforce exact array length per category, pad missing bằng default value
- Reject (log + flag) các item thừa ngoài schema
- Thêm validation bước "array length check" vào `ScoringResultValidator`

---

## 3. Mất raw AI output — debug khó khi có lỗi

**Vấn đề**
`resume_scan_raw_ai_output.ats_json` lưu JSON **sau** khi qua `ScoringResultValidator`. Khi validator có bug hoặc normalize sai, không có cách nào biết model thực sự trả về gì.

**Cải thiện**
- Thêm column `raw_ai_json` lưu output gốc của model (trước normalize), chỉ dùng cho debug/forensics
- `ats_json` vẫn là post-normalized — không thay đổi logic hiện tại

---

## 4. Prompt encoding bị mojibake

**Vấn đề**
Source file prompt có nhiều chuỗi bị lỗi encoding (lưu sai charset tại một thời điểm). Ảnh hưởng tới instruction quality, đặc biệt các đoạn tiếng Việt trong rubric.

**Cải thiện**
- Normalize toàn bộ prompt string về UTF-8 clean
- Kiểm tra bằng cách print prompt ra log 1 lần, inspect thủ công
- Lưu prompt trong file riêng (`.txt` hoặc resource file) để dễ kiểm soát encoding hơn

---

## 5. Prompt quá dài → compliance drift

**Vấn đề**
`parseResumeText` đặc biệt dài. Model dễ truncate fields cuối, drift sang plain text thay vì JSON, hoặc bỏ sót edge case trong rubric khi prompt vượt ngưỡng attention.

**Cải thiện**
Tách prompt thành 3 phần riêng biệt:
- **System instruction** — rules ngắn gọn, chỉ output contract
- **JSON schema example** — compact, không giải thích dài
- **Rubric block** — referenced bằng keys, không inline toàn bộ

Giữ nguyên temperature `0.1` và `responseMimeType=application/json` — đang tốt.

---

## 6. `prompt_version` và `ai_model` hardcode trong worker

**Vấn đề**
Không thể biết scan nào dùng prompt version nào khi cần rollback hoặc so sánh A/B. Bump version phải nhớ sửa thủ công.

**Cải thiện**
- Move `ai_model` và `prompt_version` sang config (application properties)
- Thêm `prompt_hash` (SHA-256 của prompt string) lưu vào DB — khi prompt thay đổi, hash tự động thay đổi mà không cần nhớ bump

---

## Tổng hợp theo độ ưu tiên

| # | Vấn đề | Mức độ |
|---|--------|--------|
| 2 | Positional array mapping | 🔴 High |
| 1 | Vision heuristic mis-route | 🔴 High |
| 3 | Mất raw AI output | 🟡 Medium |
| 4 | Prompt encoding mojibake | 🟡 Medium |
| 5 | Prompt quá dài | 🟢 Low |
| 6 | prompt_version hardcode | 🟢 Low |
