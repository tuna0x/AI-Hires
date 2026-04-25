package com.project.AIH.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiService {

    private final WebClient webClient = WebClient.create();

    @Value("${app.gemini.api-key}")
    private String apiKey;

    @Value("${app.gemini.api-url}")
    private String apiUrl;

    public String analyzeResume(byte[] fileBytes, String contentType, String jobDescription) {
        String base64File = Base64.getEncoder().encodeToString(fileBytes);
        
        String promptText = String.format(
                "Bạn là hệ thống phân tích CV tự động (ATS) cấp cao và là một chuyên gia tuyển dụng (Headhunter) quốc tế. " +
                "Nhiệm vụ của bạn là đánh giá cực kỳ khắt khe CV đính kèm so với Mô tả công việc (JD) qua 4 Giai đoạn. " +
                "Lưu ý quan trọng: Hãy 'nhìn' kỹ bố cục, định dạng, các biểu đồ kỹ năng và nội dung của file CV để đánh giá chính xác nhất. " +
                "Hệ thống phải xử lý mượt mà cả Tiếng Anh và Tiếng Việt.\n\n" +
                "--- MÔ TẢ CÔNG VIỆC (JD) ---\n%s\n\n" +
                "YÊU CẦU TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (TUYỆT ĐỐI KHÔNG CÓ MARKDOWN HAY TEXT THỪA) THEO CẤU TRÚC SAU:\n" +
                "{\n" +
                "  \"total_score\": <Tổng điểm 0-100>,\n" +
                "  \"stage1_detection\": {\n" +
                "    \"name\": \"<Tên ứng viên>\",\n" +
                "    \"level\": \"<Cấp độ dự đoán: Intern/Fresher/Junior/Middle/Senior>\",\n" +
                "    \"industry\": \"<Ngành nghề chính>\"\n" +
                "  },\n" +
                "  \"stage2_core\": {\n" +
                "    \"score\": <Tổng điểm GĐ 2 (Tối đa 60)>,\n" +
                "    \"ats_format\": {\n" +
                "      \"score\": <Tối đa 20>,\n" +
                "      \"details\": [\n" +
                "        \"File Technical: +<điểm>/5 (Đánh giá định dạng file)\",\n" +
                "        \"ATS Parsability: +<điểm>/8 (Cấu trúc có dễ đọc máy không, header chuẩn không)\",\n" +
                "        \"Typography: +<điểm>/4 (Trình bày font, canh lề)\",\n" +
                "        \"Length: +<điểm>/3 (Độ dài CV phù hợp cấp độ không)\"\n" +
                "      ]\n" +
                "    },\n" +
                "    \"professional_foundation\": {\n" +
                "      \"score\": <Tối đa 20>,\n" +
                "      \"details\": [\n" +
                "        \"Contact: +<điểm>/4 (Đầy đủ Tên, SĐT, Email, LinkedIn...)\",\n" +
                "        \"Summary: +<điểm>/5 (Mục tiêu rõ ràng, thể hiện định hướng)\",\n" +
                "        \"Sections: +<điểm>/6 (Đầy đủ Kinh nghiệm, Học vấn, Kỹ năng)\",\n" +
                "        \"Organization: +<điểm>/5 (Thứ tự các mục hợp lý)\"\n" +
                "      ]\n" +
                "    },\n" +
                "    \"content_quality\": {\n" +
                "      \"score\": <Tối đa 20>,\n" +
                "      \"details\": [\n" +
                "        \"Language: +<điểm>/5 (Ngữ pháp, động từ mạnh, từ vựng chuyên ngành)\",\n" +
                "        \"Quantification: +<điểm>/8 (Sử dụng số liệu định lượng, kết quả cụ thể)\",\n" +
                "        \"Keywords: +<điểm>/4 (Mức độ khớp từ khóa với JD)\",\n" +
                "        \"Consistency: +<điểm>/3 (Tính nhất quán về ngày tháng, format)\"\n" +
                "      ]\n" +
                "    }\n" +
                "  },\n" +
                "  \"stage3_in_depth\": {\n" +
                "    \"score\": <Tổng điểm GĐ 3 (Tối đa 30)>,\n" +
                "    \"experience_eval\": {\n" +
                "      \"score\": <Tối đa 15>,\n" +
                "      \"details\": [\n" +
                "        \"Progression: +<điểm>/3 (Sự thăng tiến, phát triển kỹ năng)\",\n" +
                "        \"Bullet Quality: +<điểm>/6 (Mô tả công việc rõ ràng, nêu rõ trách nhiệm)\",\n" +
                "        \"Scope & Impact: +<điểm>/6 (Phạm vi công việc và mức độ ảnh hưởng)\"\n" +
                "      ]\n" +
                "    },\n" +
                "    \"technical_evidence\": {\n" +
                "      \"score\": <Tối đa 8>,\n" +
                "      \"details\": [\"Chi tiết bằng chứng kỹ năng: +<điểm>/8\"]\n" +
                "    },\n" +
                "    \"projects\": {\n" +
                "      \"score\": <Tối đa 5>,\n" +
                "      \"details\": [\"Đánh giá chất lượng dự án: +<điểm>/5\"]\n" +
                "    },\n" +
                "    \"certs\": {\n" +
                "      \"score\": <Tối đa 2>,\n" +
                "      \"details\": [\"Bằng cấp, chứng chỉ liên quan: +<điểm>/2\"]\n" +
                "    }\n" +
                "  },\n" +
                "  \"stage4_bonus\": {\n" +
                "    \"score\": <Tối đa 10>,\n" +
                "    \"details\": [\n" +
                "      \"Leadership: +<điểm>/2\",\n" +
                "      \"International: +<điểm>/2\",\n" +
                "      \"Awards: +<điểm>/2\",\n" +
                "      \"Learning: +<điểm>/2\",\n" +
                "      \"Category-Specific: +<điểm>/2\"\n" +
                "    ]\n" +
                "  },\n" +
                "  \"strengths\": [\"<Liệt kê 2-3 điểm mạnh cốt lõi>\"]\n," +
                "  \"priority_actions\": [\n" +
                "    { \"action\": \"<Hành động 1>\", \"priority\": \"Cao\" },\n" +
                "    { \"action\": \"<Hành động 2>\", \"priority\": \"Trung bình\" }\n" +
                "  ]\n" +
                "}\n\n" +
                "Lưu ý: Toàn bộ JSON trả về phải sử dụng Tiếng Việt cho các mô tả (details, strengths, actions). Phân tích thật sâu, dựa trên cả hình ảnh trực quan của CV.",
                jobDescription
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", promptText),
                                Map.of("inlineData", Map.of(
                                        "mimeType", contentType,
                                        "data", base64File
                                ))
                        ))
                )
        );

        try {
            log.info("Sending multimodal request to Gemini AI for resume analysis...");
            return webClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage());
            throw new RuntimeException("AI Analysis service is temporarily unavailable", e);
        }
    }
}
