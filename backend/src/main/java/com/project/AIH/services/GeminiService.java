package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
                                "Bạn là hệ thống phân tích CV tự động (ATS) cấp cao và là một chuyên gia tuyển dụng (Headhunter) quốc tế. "
                                                +
                                                "Nhiệm vụ của bạn là đánh giá cực kỳ khắt khe CV đính kèm so với Mô tả công việc (JD) qua 4 Giai đoạn. "
                                                +
                                                "Lưu ý quan trọng: Hãy 'nhìn' kỹ bố cục, định dạng, các biểu đồ kỹ năng và nội dung của file CV để đánh giá chính xác nhất. "
                                                +
                                                "Hệ thống phải xử lý mượt mà cả Tiếng Anh và Tiếng Việt.\n\n" +
                                                "THANG ĐIỂM THAM CHIẾU (bắt buộc tuân thủ, chấm NGHIÊM KHẮC):\n" +
                                                "- 85-100: Xuất sắc — top 5% ứng viên, CV gần như hoàn hảo\n" +
                                                "- 70-84 : Tốt — cạnh tranh được ở thị trường\n" +
                                                "- 55-69 : Trung bình — cần cải thiện đáng kể\n" +
                                                "- Dưới 55: Yếu — cần làm lại CV từ đầu\n" +
                                                "Hầu hết CV thực tế nằm ở mức 45-70. Không grade inflate.\n\n" +
                                                "--- MÔ TẢ CÔNG VIỆC (JD) ---\n%s\n\n" +
                                                "YÊU CẦU TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (TUYỆT ĐỐI KHÔNG CÓ MARKDOWN HAY TEXT THỪA) THEO CẤU TRÚC SAU:\n"
                                                +
                                                "{\n" +
                                                "  \"total_score\": <Tổng điểm = stage2_core.score + stage3_in_depth.score + stage4_bonus.score>,\n" +
                                                "  \"stage1_detection\": {\n" +
                                                "    \"name\": \"<Tên ứng viên>\",\n" +
                                                "    \"level\": \"<Cấp độ dự đoán: Intern/Fresher/Junior/Middle/Senior>\",\n"
                                                +
                                                "    \"industry\": \"<Ngành nghề chính>\"\n" +
                                                "  },\n" +
                                                "  \"stage2_core\": {\n" +
                                                "    \"score\": <Tổng điểm GĐ 2 (Tối đa 60)>,\n" +
                                                "    \"ats_format\": {\n" +
                                                "      \"score\": <Tối đa 20>,\n" +
                                                "      \"details\": [\n" +
                                                "        \"File Technical: +<điểm>/5 (Đánh giá định dạng file)\",\n" +
                                                "        \"ATS Parsability: +<điểm>/8 (Cấu trúc có dễ đọc máy không, header chuẩn không)\",\n"
                                                +
                                                "        \"Typography: +<điểm>/4 (Trình bày font, canh lề)\",\n" +
                                                "        \"Length: +<điểm>/3 (Độ dài CV phù hợp cấp độ không)\"\n" +
                                                "      ]\n" +
                                                "    },\n" +
                                                "    \"professional_foundation\": {\n" +
                                                "      \"score\": <Tối đa 20>,\n" +
                                                "      \"details\": [\n" +
                                                "        \"Contact: +<điểm>/4 (Đầy đủ Tên, SĐT, Email, LinkedIn...)\",\n"
                                                +
                                                "        \"Summary: +<điểm>/5 (Mục tiêu rõ ràng, thể hiện định hướng)\",\n"
                                                +
                                                "        \"Sections: +<điểm>/6 (Đầy đủ Kinh nghiệm, Học vấn, Kỹ năng)\",\n"
                                                +
                                                "        \"Organization: +<điểm>/5 (Thứ tự các mục hợp lý)\"\n" +
                                                "      ]\n" +
                                                "    },\n" +
                                                "    \"content_quality\": {\n" +
                                                "      \"score\": <Tối đa 20>,\n" +
                                                "      \"details\": [\n" +
                                                "        \"Language: +<điểm>/5 (Ngữ pháp, động từ mạnh, từ vựng chuyên ngành)\",\n"
                                                +
                                                "        \"Quantification: +<điểm>/8 (Sử dụng số liệu định lượng, kết quả cụ thể)\",\n"
                                                +
                                                "        \"Keywords: +<điểm>/4 (Mức độ khớp từ khóa với JD)\",\n" +
                                                "        \"Consistency: +<điểm>/3 (Tính nhất quán về ngày tháng, format)\"\n"
                                                +
                                                "      ]\n" +
                                                "    }\n" +
                                                "  },\n" +
                                                "  \"stage3_in_depth\": {\n" +
                                                "    \"score\": <Tổng điểm GĐ 3 (Tối đa 30)>,\n" +
                                                "    \"experience_eval\": {\n" +
                                                "      \"score\": <Tối đa 15>,\n" +
                                                "      \"details\": [\n" +
                                                "        \"Progression: +<điểm>/3 (Sự thăng tiến, phát triển kỹ năng)\",\n"
                                                +
                                                "        \"Bullet Quality: +<điểm>/6 (Mô tả công việc rõ ràng, nêu rõ trách nhiệm)\",\n"
                                                +
                                                "        \"Scope & Impact: +<điểm>/6 (Phạm vi công việc và mức độ ảnh hưởng)\"\n"
                                                +
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
                                                "      \"Category-Specific: +<điểm>/2 (Theo ngành: IT→GitHub/Portfolio/side project; Marketing→Case study/campaign result; Finance→CFA/CPA/số liệu P&L; Design→Behance/Dribbble link; Sales→Revenue quota attainment)\"\n" +
                                                "    ]\n" +
                                                "  },\n" +
                                                "  \"sub_tips\": {\n" +
                                                "    \"file_technical\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"ats_parsability\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"typography\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"length\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"contact\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"summary\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"sections\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"organization\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"language\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"quantification\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"keywords\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"consistency\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"progression\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"bullet_quality\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"scope_impact\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"technical_evidence\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"projects\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"certs\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"leadership\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"international\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"awards\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"learning\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                                "    \"category_specific\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\"\n" +
                                                "  },\n" +
                                                "  \"strengths\": [\"<Liệt kê 2-3 điểm mạnh cốt lõi>\"],\n" +
                                                "  \"priority_actions\": [\n" +
                                                "    { \"action\": \"<Hành động 1>\", \"priority\": \"Cao\" },\n" +
                                                "    { \"action\": \"<Hành động 2>\", \"priority\": \"Trung bình\" }\n" +
                                                "  ]\n" +
                                                "}\n\n" +
                                                "Lưu ý: Toàn bộ JSON trả về phải sử dụng Tiếng Việt cho các mô tả (details, strengths, actions, sub_tips). Quy tắc lọc sub_tips: Sinh dữ liệu tip cá nhân hóa sâu sắc (bám sát theo ngành nghề, vai trò, trình độ và thể loại CV cụ thể) cho tất cả các sub-item chưa đạt điểm tối đa (current < max). Nếu đã đạt tối đa thì trả về null. Phân tích thật sâu, dựa trên cả hình ảnh trực quan của CV.",
                                jobDescription);

                Map<String, Object> requestBody = Map.of(
                                "contents", List.of(
                                                Map.of("parts", List.of(
                                                                Map.of("text", promptText),
                                                                Map.of("inlineData", Map.of(
                                                                                "mimeType", contentType,
                                                                                "data", base64File))))));

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

         public String parseResume(byte[] fileBytes, String contentType) {
                String base64File = Base64.getEncoder().encodeToString(fileBytes);

                String promptText = "Bạn là hệ thống phân tích CV tự động (ATS) cấp cao và là một chuyên gia tuyển dụng (Headhunter) quốc tế. "
                                +
                                "Nhiệm vụ của bạn là đánh giá cực kỳ khắt khe CV đính kèm dựa trên các tiêu chuẩn chuyên nghiệp toàn cầu. "
                                +
                                "Lưu ý quan trọng: Hãy 'nhìn' kỹ bố cục, định dạng, các biểu đồ kỹ năng và nội dung của file CV để đánh giá chính xác nhất. "
                                +
                                "Hệ thống phải xử lý mượt mà cả Tiếng Anh và Tiếng Việt.\n\n" +
                                "THANG ĐIỂM THAM CHIẾU (bắt buộc tuân thủ, chấm NGHIÊM KHẮC):\n" +
                                "- 85-100: Xuất sắc — top 5% ứng viên, CV gần như hoàn hảo\n" +
                                "- 70-84 : Tốt — cạnh tranh được ở thị trường\n" +
                                "- 55-69 : Trung bình — cần cải thiện đáng kể\n" +
                                "- Dưới 55: Yếu — cần làm lại CV từ đầu\n" +
                                "Hầu hết CV thực tế nằm ở mức 45-70. Không grade inflate.\n\n" +
                                "YÊU CẦU TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (TUYỆT ĐỐI KHÔNG CÓ MARKDOWN HAY TEXT THỪA) THEO CẤU TRÚC SAU:\n"
                                +
                                "{\n" +
                                "  \"total_score\": <Tổng điểm = stage2_core.score + stage3_in_depth.score + stage4_bonus.score>,\n" +
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
                                "        \"ATS Parsability: +<điểm>/8 (Cấu trúc có dễ đọc máy không, header chuẩn không)\",\n"
                                +
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
                                "        \"Bullet Quality: +<điểm>/6 (Mô tả công việc rõ ràng, nêu rõ trách nhiệm)\",\n"
                                +
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
                                "      \"Category-Specific: +<điểm>/2 (Theo ngành: IT→GitHub/Portfolio/side project; Marketing→Case study/campaign result; Finance→CFA/CPA/số liệu P&L; Design→Behance/Dribbble link; Sales→Revenue quota attainment)\"\n" +
                                "    ]\n" +
                                "  },\n" +
                                "  \"sub_tips\": {\n" +
                                "    \"file_technical\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"ats_parsability\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"typography\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"length\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"contact\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"summary\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"sections\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"organization\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"language\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"quantification\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"keywords\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"consistency\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"progression\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"bullet_quality\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"scope_impact\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"technical_evidence\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"projects\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"certs\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"leadership\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"international\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"awards\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"learning\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n" +
                                "    \"category_specific\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\"\n" +
                                "  },\n" +
                                "  \"strengths\": [\"<Liệt kê 2-3 điểm mạnh cốt lõi>\"],\n" +
                                "  \"priority_actions\": [\n" +
                                "    { \"action\": \"<Hành động 1>\", \"priority\": \"Cao\" },\n" +
                                "    { \"action\": \"<Hành động 2>\", \"priority\": \"Trung bình\" }\n" +
                                "  ],\n" +
                                "  \"score_gaps\": [\n" +
                                "    {\n" +
                                "      \"section\": \"<Tên sub-item bị thiếu điểm>\",\n" +
                                "      \"current\": <Điểm hiện tại>,\n" +
                                "      \"max\": <Điểm tối đa của sub-item>,\n" +
                                "      \"lost\": <max - current>,\n" +
                                "      \"tip\": \"<Gợi ý 1 câu ngắn gọn, cụ thể, khả thi để cải thiện>\"\n" +
                                "    }\n" +
                                "  ]\n" +
                                "}\n\n" +
                                "Lưu ý: Toàn bộ JSON trả về phải sử dụng Tiếng Việt cho các mô tả (details, strengths, actions, sub_tips, score_gaps). Quy tắc lọc sub_tips và score_gaps: Sinh dữ liệu tip cá nhân hóa sâu sắc (bám sát theo ngành nghề, vai trò, trình độ và thể loại CV cụ thể) cho tất cả các sub-item chưa đạt điểm tối đa (current < max). Nếu đã đạt tối đa thì trả về null. Sắp xếp score_gaps theo 'lost' giảm dần, tối đa 5 mục. Phân tích thật sâu, dựa trên cả hình ảnh trực quan của CV.";

                Map<String, Object> requestBody = Map.of(
                                "contents", List.of(
                                                Map.of("parts", List.of(
                                                                Map.of("text", promptText),
                                                                Map.of("inlineData", Map.of(
                                                                                "mimeType", contentType,
                                                                                "data", base64File))))));

                try {
                        log.info("Sending multimodal request to Gemini AI for general resume analysis...");
                        String response = webClient.post()
                                        .uri(apiUrl + "?key=" + apiKey)
                                        .bodyValue(requestBody)
                                        .retrieve()
                                        .bodyToMono(String.class)
                                        .block();

                        JsonNode root = new ObjectMapper().readTree(response);
                        String aiResultText = root.path("candidates").get(0)
                                        .path("content").path("parts").get(0)
                                        .path("text").asText();
                        String cleaned = aiResultText.replace("```json", "").replace("```", "").trim();
                        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{[\\s\\S]*\\}");
                        java.util.regex.Matcher matcher = pattern.matcher(cleaned);
                        if (matcher.find()) {
                            return matcher.group();
                        }
                        return cleaned;
                } catch (Exception e) {
                        log.error("Error calling Gemini API for general parsing: {}", e.getMessage());
                        throw new RuntimeException("AI Analysis service is temporarily unavailable", e);
                }
        }

        private String getLevelInstruction(String level) {
                if (level == null) return "INTERN/FRESHER";
                String l = level.toUpperCase();
                if (l.contains("INTERN") || l.contains("FRESHER") || l.contains("EASY")) {
                        return "Ứng viên ở cấp độ INTERN/FRESHER. Tập trung hỏi về: Kiến thức cơ sở, lý thuyết lập trình cơ bản, lập trình hướng đối tượng (OOP) nếu là IT, các tác vụ CRUD database cơ bản, SQL đơn giản, hoặc tư duy logic căn bản và các đồ án môn học viết trong CV.";
                } else if (l.contains("JUNIOR") || l.contains("MIDDLE") || l.contains("MEDIUM") || l.contains("MID")) {
                        return "Ứng viên ở cấp độ JUNIOR/MIDDLE. Tập trung hỏi về: Tư duy viết code sạch (Clean Code), tối ưu hóa database (indexing, query optimization), kiến trúc REST API, áp dụng mẫu thiết kế phần mềm (Design Patterns), cơ chế xử lý lỗi, kiểm thử và các chức năng thực tế ứng viên đã từng triển khai trong CV.";
                } else {
                        return "Ứng viên ở cấp độ SENIOR/LEAD. Tập trung hỏi về: Thiết kế hệ thống phân tán (System Design), khả năng mở rộng hệ thống chịu tải (Scalability), tối ưu hóa hiệu năng cao (Performance tuning), xử lý bất đồng bộ/đồng thời phức tạp (concurrency/locking), bảo mật, microservices, giải quyết bài toán thắt nút cổ chai (Bottlenecks) và khả năng biện luận đưa ra các lựa chọn đánh đổi kiến trúc (Architectural Trade-offs) dựa trên các dự án lớn trong CV.";
                }
        }

        public String generateInitialQuestion(String jobDescription, String candidateCvText, String targetRole, String industry, String level) {
                String levelInstruction = getLevelInstruction(level);
                String prompt = String.format(
                                "Bạn là một chuyên gia tuyển dụng (Interviewer) AI kỳ cựu.\n" +
                                "Bạn đang phỏng vấn ứng viên ứng tuyển vị trí: %s trong ngành nghề: %s.\n" +
                                "Cấp độ yêu cầu của ứng viên: %s.\n" +
                                "Chỉ thị phỏng vấn theo cấp độ: %s\n\n" +
                                "Dưới đây là Mô tả công việc (JD):\n%s\n\n" +
                                "Dưới đây là CV của ứng viên:\n%s\n\n" +
                                "Nhiệm vụ: Hãy đặt 1 câu hỏi phỏng vấn đầu tiên bằng Tiếng Việt. Câu hỏi phải chuyên sâu, tập trung khai thác kỹ năng của ứng viên bám sát JD và CV.\n" +
                                "Yêu cầu phản hồi: Trả về chuỗi JSON (KHÔNG CÓ MARKDOWN) theo cấu trúc:\n" +
                                "{\n" +
                                "  \"question\": \"<Nội dung câu hỏi phỏng vấn>\",\n" +
                                "  \"cv_context\": \"<Đoạn trích dẫn ngắn trong CV là cơ sở của câu hỏi, nếu có>\",\n" +
                                "  \"jd_context\": \"<Đoạn trích dẫn ngắn trong JD là cơ sở của câu hỏi, nếu có>\",\n" +
                                "  \"can_reuse\": <true/false - Đánh giá xem câu hỏi này có mang tính chung chuyên môn và có thể lưu vào ngân hàng câu hỏi dùng chung để tái sử dụng hay không>\n" +
                                "}",
                                targetRole, industry, level, levelInstruction, jobDescription, candidateCvText);
                return callTextOnlyGemini(prompt);
        }

        public String evaluateAndGenerateNextQuestion(String jobDescription, String chatHistory, String latestAnswer, String targetRole, String industry, String level) {
                String levelInstruction = getLevelInstruction(level);
                String prompt = String.format(
                                "Bạn là chuyên gia tuyển dụng đang phỏng vấn ứng viên cho vị trí: %s, ngành nghề: %s, cấp độ: %s.\n" +
                                "Chỉ thị phỏng vấn theo cấp độ: %s\n\n" +
                                "JD:\n%s\n\n" +
                                "Lịch sử trò chuyện:\n%s\n\n" +
                                "Câu trả lời mới nhất của ứng viên:\n%s\n\n" +
                                "Nhiệm vụ: Chấm điểm câu trả lời và sinh câu hỏi tiếp theo.\n" +
                                "Yêu cầu trả về đúng 1 chuỗi JSON duy nhất (KHÔNG CÓ MARKDOWN) theo định dạng sau:\n" +
                                "{\n" +
                                "  \"score\": <Tổng điểm 1-10 cho câu trả lời mới nhất>,\n" +
                                "  \"feedback\": \"<Nhận xét ngắn gọn, khách quan về câu trả lời>\",\n" +
                                "  \"scores\": {\n" +
                                "    \"RELEVANCE\": { \"score\": <Điểm 0-10>, \"comment\": \"<Nhận xét tiêu chí Độ liên quan>\" },\n" +
                                "    \"DEPTH\": { \"score\": <Điểm 0-10>, \"comment\": \"<Nhận xét tiêu chí Độ sâu kiến thức>\" },\n" +
                                "    \"STRUCTURE\": { \"score\": <Điểm 0-10>, \"comment\": \"<Nhận xét tiêu chí Cấu trúc trình bày>\" },\n" +
                                "    \"COMMUNICATION\": { \"score\": <Điểm 0-10>, \"comment\": \"<Nhận xét tiêu chí Khả năng diễn đạt/giao tiếp>\" }\n" +
                                "  },\n" +
                                "  \"next_question\": {\n" +
                                "    \"question\": \"<Nội dung câu hỏi phỏng vấn tiếp theo>\",\n" +
                                "    \"cv_context\": \"<Đoạn trích dẫn ngắn trong CV liên quan đến câu hỏi này, nếu có>\",\n" +
                                "    \"jd_context\": \"<Đoạn trích dẫn ngắn trong JD liên quan đến câu hỏi này, nếu có>\",\n" +
                                "    \"can_reuse\": <true/false - Đánh giá xem câu hỏi mới này có mang tính chung chuyên môn và có thể lưu vào ngân hàng câu hỏi để tái sử dụng hay không>\n" +
                                "  }\n" +
                                "}",
                                targetRole, industry, level, levelInstruction, jobDescription, chatHistory, latestAnswer);
                return callTextOnlyGemini(prompt);
        }

        public String evaluateAnswerOnly(String questionText, String answerText, String targetRole, String industry, String level) {
                String prompt = String.format(
                                "Bạn là chuyên gia tuyển dụng đang đánh giá câu trả lời của ứng viên cho vị trí: %s, ngành: %s, trình độ: %s.\n\n" +
                                "Câu hỏi: %s\n" +
                                "Câu trả lời của ứng viên: %s\n\n" +
                                "Nhiệm vụ: Chấm điểm câu trả lời một cách khách quan.\n" +
                                "Yêu cầu trả về đúng 1 chuỗi JSON duy nhất (KHÔNG CÓ MARKDOWN) theo định dạng sau:\n" +
                                "{\n" +
                                "  \"score\": <Tổng điểm 1-10 cho câu trả lời>,\n" +
                                "  \"feedback\": \"<Nhận xét ngắn gọn, mang tính xây dựng>\",\n" +
                                "  \"scores\": {\n" +
                                "    \"RELEVANCE\": { \"score\": <Điểm 0-10>, \"comment\": \"<Nhận xét tiêu chí Độ liên quan>\" },\n" +
                                "    \"DEPTH\": { \"score\": <Điểm 0-10>, \"comment\": \"<Nhận xét tiêu chí Độ sâu kiến thức>\" },\n" +
                                "    \"STRUCTURE\": { \"score\": <Điểm 0-10>, \"comment\": \"<Nhận xét tiêu chí Cấu trúc trình bày>\" },\n" +
                                "    \"COMMUNICATION\": { \"score\": <Điểm 0-10>, \"comment\": \"<Nhận xét tiêu chí Khả năng diễn đạt/giao tiếp>\" }\n" +
                                "  }\n" +
                                "}",
                                targetRole, industry, level, questionText, answerText);
                return callTextOnlyGemini(prompt);
        }

        public String generateInitialQuestions(String jobDescription, String candidateCvText, String targetRole, String industry, String level) {
                String levelInstruction = getLevelInstruction(level);
                String prompt = String.format(
                                "Bạn là một chuyên gia tuyển dụng (Interviewer) AI kỳ cựu.\n" +
                                "Bạn đang phỏng vấn ứng viên ứng tuyển vị trí: %s trong ngành nghề: %s.\n" +
                                "Cấp độ yêu cầu của ứng viên: %s.\n" +
                                "Chỉ thị phỏng vấn theo cấp độ: %s\n\n" +
                                "Dưới đây là Mô tả công việc (JD):\n%s\n\n" +
                                "Dưới đây là CV của ứng viên:\n%s\n\n" +
                                "Nhiệm vụ: Hãy chuẩn bị 3 câu hỏi phỏng vấn cơ sở đầu tiên bằng Tiếng Việt (Câu 1, Câu 2, Câu 3). Các câu hỏi này phải chuyên sâu, tập trung khai thác kỹ năng cốt lõi của ứng viên bám sát JD và CV.\n" +
                                "Yêu cầu phản hồi: Trả về một mảng JSON chứa đúng 3 object (TUYỆT ĐỐI KHÔNG CÓ TRÍCH DẪN MARKDOWN HOẶC TEXT THỪA) theo cấu trúc chính xác sau:\n" +
                                "[\n" +
                                "  {\n" +
                                "    \"question\": \"<Nội dung câu hỏi phỏng vấn số 1>\",\n" +
                                "    \"cv_context\": \"<Đoạn trích dẫn ngắn trong CV liên quan đến câu 1, nếu có>\",\n" +
                                "    \"jd_context\": \"<Đoạn trích dẫn ngắn trong JD liên quan đến câu 1, nếu có>\",\n" +
                                "    \"can_reuse\": true\n" +
                                "  },\n" +
                                "  {\n" +
                                "    \"question\": \"<Nội dung câu hỏi phỏng vấn số 2>\",\n" +
                                "    \"cv_context\": \"<Đoạn trích dẫn ngắn trong CV liên quan đến câu 2, nếu có>\",\n" +
                                "    \"jd_context\": \"<Đoạn trích dẫn ngắn trong JD liên quan đến câu 2, nếu có>\",\n" +
                                "    \"can_reuse\": true\n" +
                                "  },\n" +
                                "  {\n" +
                                "    \"question\": \"<Nội dung câu hỏi phỏng vấn số 3>\",\n" +
                                "    \"cv_context\": \"<Đoạn trích dẫn ngắn trong CV liên quan đến câu 3, nếu có>\",\n" +
                                "    \"jd_context\": \"<Đoạn trích dẫn ngắn trong JD liên quan đến câu 3, nếu có>\",\n" +
                                "    \"can_reuse\": true\n" +
                                "  }\n" +
                                "]",
                                targetRole, industry, level, levelInstruction, jobDescription, candidateCvText);
                return callTextOnlyGemini(prompt);
        }

        public String generateNextQuestion(String jobDescription, String runningSummary, String previousQuestion, String previousAnswer, String targetRole, String industry, String level) {
                String levelInstruction = getLevelInstruction(level);
                String prompt = String.format(
                                "Bạn là chuyên gia tuyển dụng đang phỏng vấn ứng viên cho vị trí: %s, ngành nghề: %s, cấp độ: %s.\n" +
                                "Chỉ thị phỏng vấn theo cấp độ: %s\n\n" +
                                "JD:\n%s\n\n" +
                                "Tóm tắt kết quả thể hiện của ứng viên qua các câu trả lời trước đó (Running Summary):\n%s\n\n" +
                                "Câu hỏi trước đó: %s\n" +
                                "Câu trả lời của ứng viên cho câu hỏi đó: %s\n\n" +
                                "Nhiệm vụ: Dựa trên tóm tắt năng lực và câu trả lời mới nhất, hãy đặt câu hỏi phỏng vấn tiếp theo bằng Tiếng Việt. Câu hỏi phải mang tính bám đuổi chuyên môn, đào sâu bối cảnh, hỏi xoáy đáp xoay hoặc kiểm nghiệm tính xác thực của câu trả lời trước.\n" +
                                "Yêu cầu trả về đúng 1 chuỗi JSON duy nhất (KHÔNG CÓ MARKDOWN) theo định dạng sau:\n" +
                                "{\n" +
                                "  \"question\": \"<Nội dung câu hỏi phỏng vấn tiếp theo>\",\n" +
                                "  \"cv_context\": \"<Đoạn trích dẫn ngắn trong CV liên quan đến câu hỏi này, nếu có>\",\n" +
                                "  \"jd_context\": \"<Đoạn trích dẫn ngắn trong JD liên quan đến câu hỏi này, nếu có>\",\n" +
                                "  \"can_reuse\": false\n" +
                                "}",
                                targetRole, industry, level, levelInstruction, jobDescription, 
                                (runningSummary != null && !runningSummary.isEmpty()) ? runningSummary : "Chưa có đánh giá tích lũy.", 
                                previousQuestion, previousAnswer);
                return callTextOnlyGemini(prompt);
        }

        public String updateRunningSummary(String currentSummary, String questionText, String answerText, int score) {
                String prompt = String.format(
                                "Bạn là trợ lý AI giám sát phỏng vấn chuyên nghiệp.\n" +
                                "Nhiệm vụ của bạn là tổng hợp và cập nhật tóm tắt năng lực tích lũy (Running Summary) của ứng viên bằng Tiếng Việt dựa trên dữ liệu mới.\n\n" +
                                "Tóm tắt năng lực trước đó: %s\n\n" +
                                "Câu hỏi vừa trả lời: %s\n" +
                                "Câu trả lời của ứng viên: %s\n" +
                                "Điểm số đạt được: %d/10\n\n" +
                                "Hãy cập nhật và viết lại một bản tóm tắt năng lực tích lũy mới bằng Tiếng Việt (không quá 150 từ, súc tích, mang tính chuyên môn). Tập trung làm nổi bật: Điểm mạnh cốt lõi đã được kiểm chứng, điểm yếu chuyên môn cần lưu ý, mức độ hiểu biết lý thuyết và khả năng thực hành thực tế.",
                                (currentSummary != null && !currentSummary.isEmpty()) ? currentSummary : "Chưa có đánh giá tích lũy.",
                                questionText, answerText, score);
                return callTextOnlyGemini(prompt);
        }

        public String generateFinalReport(String jobDescription, String chatHistory) {
                String prompt = String.format(
                                "Dựa trên lịch sử phỏng vấn sau đây:\n%s\n\n" +
                                                "Và JD:\n%s\n\n" +
                                                "Hãy tổng hợp một báo cáo đánh giá cuối cùng dưới định dạng JSON (KHÔNG CÓ MARKDOWN):\n"
                                                +
                                                "{\n" +
                                                "  \"final_score\": <Điểm trung bình 0-100>,\n" +
                                                "  \"strengths\": [\"...\"],\n" +
                                                "  \"weaknesses\": [\"...\"],\n" +
                                                "  \"decision\": \"PASS | CONSIDER | FAIL\",\n" +
                                                "  \"summary\": \"<Đánh giá tổng quan>\"\n" +
                                                "}",
                                chatHistory, jobDescription);
                return callTextOnlyGemini(prompt);
        }

        public String parseDetailedResume(String extractedText) {
                String promptText = "Bạn là hệ thống trích xuất thông tin CV (Resume Parser) chuyên nghiệp.\n"
                                + "Nhiệm vụ của bạn là đọc kỹ đoạn văn bản thô được trích xuất từ CV dưới đây, phân tích và trích xuất đầy đủ, chính xác các thông tin chi tiết cấu trúc sang định dạng JSON.\n\n"
                                + "Đoạn văn bản CV thô:\n" + extractedText + "\n\n"
                                + "YÊU CẦU TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (TUYỆT ĐỐI KHÔNG CÓ MARKDOWN HAY TEXT THỪA) THEO CẤU TRÚC SAU:\n"
                                + "{\n"
                                + "  \"basicInfo\": {\n"
                                + "    \"fullName\": \"<Họ và tên hoặc null>\",\n"
                                + "    \"email\": \"<Email hoặc null>\",\n"
                                + "    \"phone\": \"<Số điện thoại hoặc null>\",\n"
                                + "    \"address\": \"<Địa chỉ hoặc null>\",\n"
                                + "    \"dateOfBirth\": \"<Ngày sinh dạng yyyy-MM-dd hoặc null>\",\n"
                                + "    \"linkedinUrl\": \"<Link LinkedIn hoặc null>\",\n"
                                + "    \"githubUrl\": \"<Link GitHub hoặc null>\",\n"
                                + "    \"portfolioUrl\": \"<Link Portfolio/Website cá nhân hoặc null>\",\n"
                                + "    \"objective\": \"<Mục tiêu nghề nghiệp hoặc null>\",\n"
                                + "    \"predictedLevel\": \"<INTERN | FRESHER | JUNIOR | MIDDLE | SENIOR>\",\n"
                                + "    \"predictedIndustry\": \"<Ngành nghề chính>\"\n"
                                + "  },\n"
                                + "  \"skills\": [\n"
                                + "    {\n"
                                + "      \"skillName\": \"<Tên kỹ năng>\",\n"
                                + "      \"category\": \"<TECHNICAL | SOFT | LANGUAGE | TOOL>\",\n"
                                + "      \"proficiencyLevel\": \"<BEGINNER | INTERMEDIATE | ADVANCED | EXPERT>\",\n"
                                + "      \"yearsOfExperience\": <Số năm kinh nghiệm hoặc null>\n"
                                + "    }\n"
                                + "  ],\n"
                                + "  \"experiences\": [\n"
                                + "    {\n"
                                + "      \"companyName\": \"<Tên công ty>\",\n"
                                + "      \"position\": \"<Vị trí công tác>\",\n"
                                + "      \"location\": \"<Địa điểm hoặc null>\",\n"
                                + "      \"startDate\": \"<yyyy-MM-dd hoặc null>\",\n"
                                + "      \"endDate\": \"<yyyy-MM-dd hoặc null>\",\n"
                                + "      \"isCurrent\": <true | false>,\n"
                                + "      \"description\": \"<Mô tả chi tiết công việc>\",\n"
                                + "      \"achievements\": \"<Thành tựu đạt được hoặc null>\"\n"
                                + "    }\n"
                                + "  ],\n"
                                + "  \"educations\": [\n"
                                + "    {\n"
                                + "      \"institutionName\": \"<Tên trường học/Trung tâm đào tạo>\",\n"
                                + "      \"degree\": \"<Bằng cấp/Chứng chỉ đào tạo hoặc null>\",\n"
                                + "      \"fieldOfStudy\": \"<Ngành học hoặc null>\",\n"
                                + "      \"startDate\": \"<yyyy-MM-dd hoặc null>\",\n"
                                + "      \"endDate\": \"<yyyy-MM-dd hoặc null>\",\n"
                                + "      \"gpa\": <GPA hệ 4 hoặc null, ví dụ 3.5>,\n"
                                + "      \"description\": \"<Mô tả thêm về quá trình học tập hoặc null>\"\n"
                                + "    }\n"
                                + "  ],\n"
                                + "  \"certifications\": [\n"
                                + "    {\n"
                                + "      \"name\": \"<Tên chứng chỉ>\",\n"
                                + "      \"issuingOrganization\": \"<Tổ chức cấp hoặc null>\",\n"
                                + "      \"issueDate\": \"<yyyy-MM-dd hoặc null>\",\n"
                                + "      \"expiryDate\": \"<yyyy-MM-dd hoặc null>\",\n"
                                + "      \"credentialUrl\": \"<Đường dẫn xác minh hoặc null>\"\n"
                                + "    }\n"
                                + "  ],\n"
                                + "  \"projects\": [\n"
                                + "    {\n"
                                + "      \"name\": \"<Tên dự án>\",\n"
                                + "      \"role\": \"<Vai trò trong dự án>\",\n"
                                + "      \"technologies\": \"<Các công nghệ sử dụng, phân tách bằng dấu phẩy>\",\n"
                                + "      \"description\": \"<Mô tả dự án>\",\n"
                                + "      \"url\": \"<Đường dẫn dự án hoặc null>\",\n"
                                + "      \"startDate\": \"<yyyy-MM-dd hoặc null>\",\n"
                                + "      \"endDate\": \"<yyyy-MM-dd hoặc null>\"\n"
                                + "    }\n"
                                + "  ],\n"
                                + "  \"languages\": [\n"
                                + "    {\n"
                                + "      \"language\": \"<Tên ngôn ngữ>\",\n"
                                + "      \"proficiency\": \"<BASIC | CONVERSATIONAL | PROFESSIONAL | NATIVE>\"\n"
                                + "    }\n"
                                + "  ]\n"
                                + "}";
                return callTextOnlyGemini(promptText);
        }

        private String callTextOnlyGemini(String promptText) {
                Map<String, Object> requestBody = Map.of(
                                "contents", List.of(
                                                Map.of("parts", List.of(
                                                                Map.of("text", promptText)))));

                try {
                        log.info("Sending text-only request to Gemini API...");
                        String responseStr = webClient.post()
                                        .uri(apiUrl + "?key=" + apiKey)
                                        .bodyValue(requestBody)
                                        .retrieve()
                                        .bodyToMono(String.class)
                                        .block();

                        JsonNode root = new ObjectMapper().readTree(responseStr);
                        String aiResultText = root.path("candidates").get(0)
                                        .path("content").path("parts").get(0)
                                        .path("text").asText();
                        return aiResultText.replace("```json", "").replace("```", "").trim();
                } catch (Exception e) {
                        log.error("Error calling Gemini API: {}", e.getMessage());
                        throw new RuntimeException("AI Interview service is temporarily unavailable", e);
                }
        }
}
