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
                                                "--- MÔ TẢ CÔNG VIỆC (JD) ---\n%s\n\n" +
                                                "YÊU CẦU TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (TUYỆT ĐỐI KHÔNG CÓ MARKDOWN HAY TEXT THỪA) THEO CẤU TRÚC SAU:\n"
                                                +
                                                "{\n" +
                                                "  \"total_score\": <Tổng điểm 0-100>,\n" +
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
                                                "      \"Category-Specific: +<điểm>/2\"\n" +
                                                "    ]\n" +
                                                "  },\n" +
                                                "  \"strengths\": [\"<Liệt kê 2-3 điểm mạnh cốt lõi>\"]\n," +
                                                "  \"priority_actions\": [\n" +
                                                "    { \"action\": \"<Hành động 1>\", \"priority\": \"Cao\" },\n" +
                                                "    { \"action\": \"<Hành động 2>\", \"priority\": \"Trung bình\" }\n"
                                                +
                                                "  ]\n" +
                                                "}\n\n" +
                                                "Lưu ý: Toàn bộ JSON trả về phải sử dụng Tiếng Việt cho các mô tả (details, strengths, actions). Phân tích thật sâu, dựa trên cả hình ảnh trực quan của CV.",
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
                                "YÊU CẦU TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (TUYỆT ĐỐI KHÔNG CÓ MARKDOWN HAY TEXT THỪA) THEO CẤU TRÚC SAU:\n"
                                +
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
                                "        \"Quantification: +<điểm>/8 (Sử dụng số liệu định lượng, kết quả cụ thể)\",\n"
                                +
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
                                "      \"Category-Specific: +<điểm>/2\"\n" +
                                "    ]\n" +
                                "  },\n" +
                                "  \"strengths\": [\"<Liệt kê 2-3 điểm mạnh cốt lõi>\"]\n," +
                                "  \"priority_actions\": [\n" +
                                "    { \"action\": \"<Hành động 1>\", \"priority\": \"Cao\" },\n" +
                                "    { \"action\": \"<Hành động 2>\", \"priority\": \"Trung bình\" }\n" +
                                "  ]\n" +
                                "}\n\n" +
                                "Lưu ý: Toàn bộ JSON trả về phải sử dụng Tiếng Việt cho các mô tả (details, strengths, actions). Phân tích thật sâu, dựa trên cả hình ảnh trực quan của CV.";

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
                        return aiResultText.replace("```json", "").replace("```", "").trim();
                } catch (Exception e) {
                        log.error("Error calling Gemini API for general parsing: {}", e.getMessage());
                        throw new RuntimeException("AI Analysis service is temporarily unavailable", e);
                }
        }

        public String generateInitialQuestion(String jobDescription, String candidateCvText) {
                String prompt = String.format(
                                "Bạn là một chuyên gia tuyển dụng (Interviewer) AI khó tính. Hãy đóng vai trò là người phỏng vấn ứng viên.\n"
                                                +
                                                "Dưới đây là Mô tả công việc (JD):\n%s\n\n" +
                                                "Dưới đây là CV của ứng viên:\n%s\n\n" +
                                                "Nhiệm vụ: Hãy đặt 1 câu hỏi đầu tiên thật chuyên sâu dựa trên kinh nghiệm của ứng viên trong CV và yêu cầu của JD. Chỉ đặt 1 câu hỏi, bằng Tiếng Việt, không kèm giải thích thừa.",
                                jobDescription, candidateCvText);
                return callTextOnlyGemini(prompt);
        }

        public String evaluateAndGenerateNextQuestion(String jobDescription, String chatHistory, String latestAnswer) {
                String prompt = String.format(
                                "Bạn là chuyên gia tuyển dụng đang phỏng vấn ứng viên.\n" +
                                                "JD:\n%s\n\n" +
                                                "Lịch sử trò chuyện:\n%s\n\n" +
                                                "Câu trả lời mới nhất của ứng viên:\n%s\n\n" +
                                                "Nhiệm vụ trả về 1 chuỗi JSON (KHÔNG CÓ MARKDOWN) theo định dạng:\n" +
                                                "{\n" +
                                                "  \"score\": <Điểm 1-10 cho câu trả lời mới nhất>,\n" +
                                                "  \"feedback\": \"<Nhận xét ngắn gọn về câu trả lời>\",\n" +
                                                "  \"next_question\": \"<Câu hỏi tiếp theo, chuyên sâu hơn hoặc chuyển chủ đề tùy thuộc vào câu trả lời>\"\n"
                                                +
                                                "}",
                                jobDescription, chatHistory, latestAnswer);
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
