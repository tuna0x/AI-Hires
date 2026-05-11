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
import java.time.Duration;
import reactor.util.retry.Retry;
import java.util.concurrent.TimeoutException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiService {

        private final WebClient webClient = WebClient.create();

        @Value("${app.gemini.api-key}")
        private String apiKey;

        @Value("${app.gemini.api-url}")
        private String apiUrl;

        public String analyzeResume(byte[] fileBytes, String contentType, String jobDescription, com.project.AIH.utils.constant.JobLevelEnum targetLevel) {
                String base64File = Base64.getEncoder().encodeToString(fileBytes);

                String levelInstruction = "";
                if (targetLevel != null) {
                    levelInstruction = "\n--- CẤP ĐỘ CÔNG VIỆC YÊU CẦU: " + targetLevel.name() + " ---\n";
                    switch (targetLevel) {
                        case INTERN:
                        case FRESHER:
                            levelInstruction += "HƯỚNG DẪN ĐÁNH GIÁ CẤP ĐỘ INTERN/FRESHER:\n"
                                    + "- Giảm nhẹ sự khắt khe về mặt bề dày kinh nghiệm làm việc thực tế.\n"
                                    + "- Tập trung đánh giá mạnh mẽ vào TIỀN NĂNG phát triển, tốc độ học hỏi, các hoạt động ngoại khóa, đồ án môn học, side projects, kỹ năng học tập liên tục và tư duy giải quyết vấn đề.\n"
                                    + "- Cho phép điểm cộng tốt ở Stage 4 nếu có các chứng chỉ tự học online, thành tích học tập xuất sắc hoặc hoạt động tích cực.\n";
                            break;
                        case JUNIOR:
                            levelInstruction += "HƯỚNG DẪN ĐÁNH GIÁ CẤP ĐỘ JUNIOR:\n"
                                    + "- Đánh giá kỹ năng làm việc độc lập cơ bản, nắm vững các công cụ/ngôn ngữ lập trình cốt lõi của ngành nghề.\n"
                                    + "- Yêu cầu có ít nhất 1-2 dự án thực tế hoặc đồ án lớn có chiều sâu kỹ thuật.\n"
                                    + "- Kỳ vọng có sự thấu hiểu quy trình làm việc chuẩn trong team.\n";
                            break;
                        case MIDDLE:
                            levelInstruction += "HƯỚNG DẪN ĐÁNH GIÁ CẤP ĐỘ MIDDLE:\n"
                                    + "- Đòi hỏi kinh nghiệm làm việc thực tế từ 2-4 năm, làm chủ hoàn toàn các mảng công việc được giao.\n"
                                    + "- Đánh giá cao việc tự thiết kế giải pháp kỹ thuật, viết code sạch, tối ưu hóa hiệu năng, giải quyết các bài toán phức tạp bậc trung.\n"
                                    + "- Đòi hỏi bằng chứng rõ ràng về tác động (impact) và số liệu định lượng (quantification) trong các dự án.\n";
                            break;
                        case SENIOR:
                        case LEAD:
                        case MANAGER:
                            levelInstruction += "HƯỚNG DẪN ĐÁNH GIÁ CẤP ĐỘ " + targetLevel.name() + " (CỰC KỲ KHẮT KHE):\n"
                                    + "- Đòi hỏi kinh nghiệm dày dặn (>= 5 năm), khả năng thiết kế kiến trúc hệ thống (architecture design), dẫn dắt kỹ thuật (technical leadership), hoặc quản lý dự án/con người.\n"
                                    + "- Đánh giá cực kỳ khắt khe về tầm ảnh hưởng kinh doanh (business/scope impact) và số liệu định lượng khổng lồ.\n"
                                    + "- Trừ điểm mạnh nếu CV viết chung chung kiểu Junior, thiếu bằng chứng về việc tối ưu quy trình, quản trị rủi ro hoặc mentor cho thế hệ sau.\n";
                            break;
                    }
                }

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
                                                "%s\n" +
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
                                                "    \"score\": <Tổng điểm GĐ 2 (Tối đa 50)>,\n" +
                                                "    \"ats_format\": {\n" +
                                                "      \"score\": <Tối đa 12>,\n" +
                                                "      \"details\": [\n" +
                                                "        \"File Technical: +<điểm>/3 (Đánh giá định dạng file)\",\n" +
                                                "        \"ATS Parsability: +<điểm>/5 (Cấu trúc có dễ đọc máy không, header chuẩn không)\",\n"
                                                +
                                                "        \"Typography: +<điểm>/2 (Trình bày font, canh lề)\",\n" +
                                                "        \"Length: +<điểm>/2 (Độ dài CV phù hợp cấp độ không)\"\n" +
                                                "      ]\n" +
                                                "    },\n" +
                                                "    \"professional_foundation\": {\n" +
                                                "      \"score\": <Tối đa 18>,\n" +
                                                "      \"details\": [\n" +
                                                "        \"Contact: +<điểm>/4 (Đầy đủ Tên, SĐT, Email, LinkedIn...)\",\n"
                                                +
                                                "        \"Summary: +<điểm>/5 (Mục tiêu rõ ràng, thể hiện định hướng)\",\n"
                                                +
                                                "        \"Sections: +<điểm>/5 (Đầy đủ Kinh nghiệm, Học vấn, Kỹ năng)\",\n"
                                                +
                                                "        \"Organization: +<điểm>/4 (Thứ tự các mục hợp lý)\"\n" +
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
                                                "        \"Consistency: +<điểm>/3 (Tính nhất quán về ngày tháng, format)\"\n" +
                                                "      ]\n" +
                                                "    }\n" +
                                                "  },\n" +
                                                "  \"stage3_in_depth\": {\n" +
                                                "    \"score\": <Tổng điểm GĐ 3 (Tối đa 40)>,\n" +
                                                "    \"experience_eval\": {\n" +
                                                "      \"score\": <Tối đa 20>,\n" +
                                                "      \"details\": [\n" +
                                                "        \"Progression: +<điểm>/4 (Sự thăng tiến, phát triển kỹ năng)\",\n"
                                                +
                                                "        \"Bullet Quality: +<điểm>/8 (Mô tả công việc rõ ràng, nêu rõ trách nhiệm)\",\n"
                                                +
                                                "        \"Scope & Impact: +<điểm>/8 (Phạm vi công việc và mức độ ảnh hưởng)\"\n"
                                                +
                                                "      ]\n" +
                                                "    },\n" +
                                                "    \"technical_evidence\": {\n" +
                                                "      \"score\": <Tối đa 10>,\n" +
                                                "      \"details\": [\"Chi tiết bằng chứng kỹ năng: +<điểm>/10\"]\n" +
                                                "    },\n" +
                                                "    \"projects\": {\n" +
                                                "      \"score\": <Tối đa 7>,\n" +
                                                "      \"details\": [\"Đánh giá chất lượng dự án: +<điểm>/7\"]\n" +
                                                "    },\n" +
                                                "    \"certs\": {\n" +
                                                "      \"score\": <Tối đa 3>,\n" +
                                                "      \"details\": [\"Bằng cấp, chứng chỉ liên quan: +<điểm>/3\"]\n" +
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
                                                "Lưu ý: Toàn bộ JSON trả về phải sử dụng Tiếng Việt cho các mô tả (details, strengths, actions, sub_tips). Quy tắc lọc sub_tips: Sinh dữ liệu tip cá nhân hóa sâu sắc (bám sát theo ngành nghề, vai trò, trình độ và thể loại CV cụ thể) cho tất cả các sub-item chưa đạt điểm tối đa (current < max). Nếu đã đạt tối đa thì trả về null. Phân tích thật sâu, dựa trên cả hình ảnh trực quan của CV.\n\nQUY TẮC PHÁT HIỆN GIAN LẬN (Credibility Audit): Đánh giá xem ứng viên có dùng thủ thuật như nhồi nhét từ khóa vô nghĩa (keyword stuffing), sao chép nguyên bản mô tả JD, hoặc ghi lệch thời gian không. Nếu phát hiện nghi vấn, hãy trừ điểm thẳng tay tại mục Keywords hoặc Consistency (Stage 2) và bắt buộc thêm một hành động cảnh báo mức độ 'Cao' trong 'priority_actions' có tiền tố '⚠️ PHÁT HIỆN NGHI VẤN GIAN LẬN: <chi tiết>'.",
                                levelInstruction, jobDescription);

                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.1,
                                "responseMimeType", "application/json");

                Map<String, Object> requestBody = Map.of(
                                "contents", List.of(
                                                Map.of("parts", List.of(
                                                                Map.of("text", promptText),
                                                                Map.of("inlineData", Map.of(
                                                                                "mimeType", contentType,
                                                                                "data", base64File))))),
                                "generationConfig", generationConfig);

                try {
                        log.info("Sending multimodal request to Gemini AI for resume analysis...");
                        return webClient.post()
                                        .uri(apiUrl + "?key=" + apiKey)
                                        .bodyValue(requestBody)
                                        .retrieve()
                                        .bodyToMono(String.class)
                                        .timeout(Duration.ofSeconds(30))
                                        .retryWhen(Retry.backoff(2, Duration.ofSeconds(3))
                                            .filter(ex -> ex instanceof TimeoutException || ex instanceof WebClientResponseException.TooManyRequests || ex instanceof WebClientResponseException.InternalServerError))
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
                                "BẮT BUỘC tuân thủ Rubric chấm điểm Stage 4 sau đây:\n" +
                                "- Leadership (max 2đ): 0đ nếu không có, 1đ nếu mentor/lead nhóm nhỏ (<5 người hoặc <6 tháng), 2đ nếu quản lý team lớn >=5 người hoặc quản lý >=6 tháng hoặc giữ chức vụ Trưởng nhóm+.\n" +
                                "- International (max 2đ): 0đ nếu nội địa, 1đ nếu có ngoại ngữ tốt (IELTS 6.5+/TOEIC 750+) hoặc làm việc nhóm đa quốc gia, 2đ nếu làm việc trực tiếp tại công ty nước ngoài hoặc IELTS 7.0+.\n" +
                                "- Awards (max 2đ): 0đ nếu không có, 1đ nếu đạt giải nội bộ, cuộc thi nhỏ, 2đ nếu đạt giải cấp quốc gia/quốc tế hoặc được công nhận bởi tổ chức uy tín.\n" +
                                "- Learning (max 2đ): 0đ nếu không có bằng chứng tự học, 1đ nếu có chứng chỉ online lẻ hoặc học công nghệ mới, 2đ nếu có chuỗi chứng chỉ học tập liên tục hoặc contribute open source hoặc blog kỹ thuật.\n" +
                                "- Category-Specific (max 2đ): 0đ nếu không có portfolio/bằng chứng chuyên ngành, 1đ nếu có portfolio/GitHub nhưng sơ sài, 2đ nếu portfolio cực mạnh bám sát vị trí (IT->GitHub active, Design->Behance, Marketing->Case study chi tiết, Finance->CFA/CPA/số liệu P&L, Sales->Revenue quota attainment).\n\n" +
                                "YÊU CẦU TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (TUYỆT ĐỐI KHÔNG CÓ MARKDOWN HAY TEXT THỪA) THEO CẤU TRÚC SAU:\n" +
                                "{\n" +
                                "  \"total_score\": <Tổng điểm = stage2_core.score + stage3_in_depth.score + stage4_bonus.score>,\n" +
                                "  \"stage1_detection\": {\n" +
                                "    \"name\": \"<Tên ứng viên>\",\n" +
                                "    \"level\": \"<Cấp độ dự đoán: Intern/Fresher/Junior/Middle/Senior>\",\n" +
                                "    \"industry\": \"<Ngành nghề chính>\"\n" +
                                "  },\n" +
                                "  \"stage2_core\": {\n" +
                                "    \"score\": <Tổng điểm GĐ 2 (Tối đa 50)>,\n" +
                                "    \"ats_format\": {\n" +
                                "      \"score\": <Tối đa 12>,\n" +
                                "      \"details\": [\n" +
                                "        \"File Technical: +<điểm>/3 (Đánh giá định dạng file)\",\n" +
                                "        \"ATS Parsability: +<điểm>/5 (Cấu trúc có dễ đọc máy không, header chuẩn không)\",\n" +
                                "        \"Typography: +<điểm>/2 (Trình bày font, canh lề)\",\n" +
                                "        \"Length: +<điểm>/2 (Độ dài CV phù hợp cấp độ không)\"\n" +
                                "      ]\n" +
                                "    },\n" +
                                "    \"professional_foundation\": {\n" +
                                "      \"score\": <Tối đa 18>,\n" +
                                "      \"details\": [\n" +
                                "        \"Contact: +<điểm>/4 (Đầy đủ Tên, SĐT, Email, LinkedIn...)\",\n" +
                                "        \"Summary: +<điểm>/5 (Mục tiêu rõ ràng, thể hiện định hướng)\",\n" +
                                "        \"Sections: +<điểm>/5 (Đầy đủ Kinh nghiệm, Học vấn, Kỹ năng)\",\n" +
                                "        \"Organization: +<điểm>/4 (Thứ tự các mục hợp lý)\"\n" +
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
                                "    \"score\": <Tổng điểm GĐ 3 (Tối đa 40)>,\n" +
                                "    \"experience_eval\": {\n" +
                                "      \"score\": <Tối đa 20>,\n" +
                                "      \"details\": [\n" +
                                "        \"Progression: +<điểm>/4 (Sự thăng tiến, phát triển kỹ năng)\",\n" +
                                "        \"Bullet Quality: +<điểm>/8 (Mô tả công việc rõ ràng, nêu rõ trách nhiệm)\",\n" +
                                "        \"Scope & Impact: +<điểm>/8 (Phạm vi công việc và mức độ ảnh hưởng)\"\n" +
                                "      ]\n" +
                                "    },\n" +
                                "    \"technical_evidence\": {\n" +
                                "      \"score\": <Tối đa 10>,\n" +
                                "      \"details\": [\"Chi tiết bằng chứng kỹ năng: +<điểm>/10\"]\n" +
                                "    },\n" +
                                "    \"projects\": {\n" +
                                "      \"score\": <Tối đa 7>,\n" +
                                "      \"details\": [\"Đánh giá chất lượng dự án: +<điểm>/7\"]\n" +
                                "    },\n" +
                                "    \"certs\": {\n" +
                                "      \"score\": <Tối đa 3>,\n" +
                                "      \"details\": [\"Bằng cấp, chứng chỉ liên quan: +<điểm>/3\"]\n" +
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
                                "Lưu ý: Toàn bộ JSON trả về phải sử dụng Tiếng Việt cho các mô tả (details, strengths, actions, sub_tips, score_gaps). Quy tắc lọc sub_tips và score_gaps: Sinh dữ liệu tip cá nhân hóa sâu sắc (bám sát theo ngành nghề, vai trò, trình độ và thể loại CV cụ thể) cho tất cả các sub-item chưa đạt điểm tối đa (current < max). Nếu đã đạt tối đa thì trả về null. Sắp xếp score_gaps theo 'lost' giảm dần, tối đa 5 mục. Phân tích thật sâu, dựa trên cả hình ảnh trực quan của CV.\n\nQUY TẮC PHÁT HIỆN GIAN LẬN (Credibility Audit): Đánh giá xem ứng viên có dùng thủ thuật như nhồi nhét từ khóa vô nghĩa (keyword stuffing), sao chép nguyên bản mô tả JD, hoặc ghi lệch thời gian không. Nếu phát hiện nghi vấn, hãy trừ điểm thẳng tay tại mục Keywords hoặc Consistency (Stage 2) và bắt buộc thêm một hành động cảnh báo mức độ 'Cao' trong 'priority_actions' có tiền tố '⚠️ PHÁT HIỆN NGHI VẤN GIAN LẬN: <chi tiết>'.";

                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.1,
                                "responseMimeType", "application/json");

                Map<String, Object> requestBody = Map.of(
                                "contents", List.of(
                                                Map.of("parts", List.of(
                                                                Map.of("text", promptText),
                                                                Map.of("inlineData", Map.of(
                                                                                "mimeType", contentType,
                                                                                "data", base64File))))),
                                "generationConfig", generationConfig);

                try {
                        log.info("Sending multimodal request to Gemini AI for general resume analysis...");
                        String response = webClient.post()
                                        .uri(apiUrl + "?key=" + apiKey)
                                        .bodyValue(requestBody)
                                        .retrieve()
                                        .bodyToMono(String.class)
                                        .timeout(Duration.ofSeconds(30))
                                        .retryWhen(Retry.backoff(2, Duration.ofSeconds(3))
                                            .filter(ex -> ex instanceof TimeoutException || ex instanceof WebClientResponseException.TooManyRequests || ex instanceof WebClientResponseException.InternalServerError))
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
                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.1,
                                "responseMimeType", "application/json");
                return callTextOnlyGemini(prompt, 10, generationConfig); // 10s timeout for scoring
        }


        public String generateAllQuestions(String jobDescription, String candidateCvText, String targetRole, String industry, String level) {
                String levelInstruction = getLevelInstruction(level);
                String prompt = String.format(
                                "Bạn là một chuyên gia tuyển dụng (Interviewer) AI kỳ cựu.\n" +
                                "Bạn đang phỏng vấn ứng viên ứng tuyển vị trí: %s trong ngành nghề: %s.\n" +
                                "Cấp độ yêu cầu của ứng viên: %s.\n" +
                                "Chỉ thị phỏng vấn theo cấp độ: %s\n\n" +
                                "Dưới đây là Mô tả công việc (JD):\n%s\n\n" +
                                "Dưới đây là CV của ứng viên:\n%s\n\n" +
                                "Nhiệm vụ: Hãy chuẩn bị toàn bộ 5 câu hỏi phỏng vấn bằng Tiếng Việt. \n" +
                                "- Câu 1, 2, 3: Các câu hỏi nền tảng, tập trung khai thác kỹ năng cốt lõi bám sát JD (có thể tái sử dụng cho ứng viên khác).\n" +
                                "- Câu 4, 5: Các câu hỏi cá nhân hóa sâu sắc, đào sâu vào các dự án, kinh nghiệm cụ thể mà ứng viên đã ghi trong CV (không tái sử dụng cho ứng viên khác).\n" +
                                "Yêu cầu phản hồi: Trả về một mảng JSON chứa đúng 5 object (TUYỆT ĐỐI KHÔNG CÓ TRÍCH DẪN MARKDOWN HOẶC TEXT THỪA) theo cấu trúc chính xác sau:\n" +
                                "[\n" +
                                "  {\n" +
                                "    \"question\": \"<Nội dung câu hỏi phỏng vấn số 1>\",\n" +
                                "    \"cv_context\": \"<Đoạn trích dẫn ngắn trong CV liên quan, nếu có>\",\n" +
                                "    \"jd_context\": \"<Đoạn trích dẫn ngắn trong JD liên quan, nếu có>\",\n" +
                                "    \"can_reuse\": true\n" +
                                "  },\n" +
                                "  // ... tiếp tục cho đến câu 5, lưu ý câu 4, 5 can_reuse thường là false\n" +
                                "]\n" +
                                "Đảm bảo trả về đúng 5 phần tử trong mảng JSON.",
                                targetRole, industry, level, levelInstruction, jobDescription, candidateCvText);
                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.1,
                                "responseMimeType", "application/json");
                return callTextOnlyGemini(prompt, 20, generationConfig); // 20s timeout for generating 5 questions
        }

        public String generatePersonalizedQuestions(String jobDescription, String candidateCvText, String targetRole, String industry, String level, int count) {
                String levelInstruction = getLevelInstruction(level);
                String prompt = String.format(
                                "Bạn là một chuyên gia tuyển dụng (Interviewer) AI kỳ cựu.\n" +
                                "Bạn đang phỏng vấn ứng viên ứng tuyển vị trí: %s trong ngành nghề: %s.\n" +
                                "Cấp độ yêu cầu của ứng viên: %s.\n" +
                                "Chỉ thị phỏng vấn theo cấp độ: %s\n\n" +
                                "Dưới đây là Mô tả công việc (JD):\n%s\n\n" +
                                "Dưới đây là CV của ứng viên:\n%s\n\n" +
                                "Nhiệm vụ: Hãy chuẩn bị %d câu hỏi phỏng vấn cá nhân hóa bằng Tiếng Việt. \n" +
                                "Các câu hỏi này phải cực kỳ cá nhân hóa, đào sâu vào các dự án, kinh nghiệm cụ thể mà ứng viên đã ghi trong CV (không mang tính lý thuyết chung chung, không tái sử dụng cho ứng viên khác).\n" +
                                "Yêu cầu phản hồi: Trả về một mảng JSON chứa đúng %d object (TUYỆT ĐỐI KHÔNG CÓ TRÍCH DẪN MARKDOWN HOẶC TEXT THỪA) theo cấu trúc chính xác sau:\n" +
                                "[\n" +
                                "  {\n" +
                                "    \"question\": \"<Nội dung câu hỏi phỏng vấn>\",\n" +
                                "    \"cv_context\": \"<Đoạn trích dẫn ngắn trong CV liên quan, nếu có>\",\n" +
                                "    \"jd_context\": \"<Đoạn trích dẫn ngắn trong JD liên quan, nếu có>\",\n" +
                                "    \"can_reuse\": false\n" +
                                "  }\n" +
                                "]\n" +
                                "Đảm bảo trả về đúng %d phần tử trong mảng JSON.",
                                targetRole, industry, level, levelInstruction, jobDescription, candidateCvText, count, count, count);
                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.1,
                                "responseMimeType", "application/json");
                return callTextOnlyGemini(prompt, 15, generationConfig); // 15s timeout for generating personalized questions
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
                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.3);
                return callTextOnlyGemini(prompt, 10, generationConfig); // 10s for running summary
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
                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.1,
                                "responseMimeType", "application/json");
                return callTextOnlyGemini(prompt, 25, generationConfig); // 25s for final report
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
                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.1,
                                "responseMimeType", "application/json");
                return callTextOnlyGemini(promptText, 25, generationConfig);
        }

    public String parseResumeText(String extractedText) {
        String promptText = "Bạn là hệ thống phân tích CV tự động (ATS) cấp cao và là một chuyên gia tuyển dụng (Headhunter) quốc tế. "
                + "Nhiệm vụ của bạn là đánh giá cực kỳ khắt khe văn bản CV dưới đây dựa trên các tiêu chuẩn chuyên nghiệp toàn cầu.\n\n"
                + "Hệ thống phải xử lý mượt mà cả Tiếng Anh và Tiếng Việt.\n\n"
                + "THANG ĐIỂM THAM CHIẾU (bắt buộc tuân thủ, chấm NGHIÊM KHẮC):\n"
                + "- 85-100: Xuất sắc — top 5% ứng viên, CV gần như hoàn hảo\n"
                + "- 70-84 : Tốt — cạnh tranh được ở thị trường\n"
                + "- 55-69 : Trung bình — cần cải thiện đáng kể\n"
                + "- Dưới 55: Yếu — cần làm lại CV từ đầu\n"
                + "Hầu hết CV thực tế nằm ở mức 45-70. Không grade inflate.\n\n"
                + "NỘI DUNG VĂN BẢN CV:\n" + extractedText + "\n\n"
                + "YÊU CẦU TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (TUYỆT ĐỐI KHÔNG CÓ MARKDOWN HAY TEXT THỪA) THEO CẤU TRÚC SAU:\n"
                + "{\n"
                + "  \"total_score\": <Tổng điểm = stage2_core.score + stage3_in_depth.score + stage4_bonus.score>,\n"
                + "  \"stage1_detection\": {\n"
                + "    \"name\": \"<Tên ứng viên>\",\n"
                + "    \"level\": \"<Cấp độ dự đoán: Intern/Fresher/Junior/Middle/Senior>\",\n"
                + "    \"industry\": \"<Ngành nghề chính>\"\n"
                + "  },\n"
                + "  \"stage2_core\": {\n"
                + "    \"score\": <Tổng điểm GĐ 2 (Tối đa 50)>,\n"
                + "    \"ats_format\": {\n"
                + "      \"score\": <Tối đa 12>,\n"
                + "      \"details\": [\n"
                + "        \"File Technical: +<điểm>/3 (Đánh giá định dạng file)\",\n"
                + "        \"ATS Parsability: +<điểm>/5 (Cấu trúc có dễ đọc máy không, header chuẩn không)\",\n"
                + "        \"Typography: +<điểm>/2 (Trình bày font, canh lề)\",\n"
                + "        \"Length: +<điểm>/2 (Độ dài CV phù hợp cấp độ không)\"\n"
                + "      ]\n"
                + "    },\n"
                + "    \"professional_foundation\": {\n"
                + "      \"score\": <Tối đa 18>,\n"
                + "      \"details\": [\n"
                + "        \"Contact: +<điểm>/4 (Đầy đủ Tên, SĐT, Email, LinkedIn...)\",\n"
                + "        \"Summary: +<điểm>/5 (Mục tiêu rõ ràng, thể hiện định hướng)\",\n"
                + "        \"Sections: +<điểm>/5 (Đầy đủ Kinh nghiệm, Học vấn, Kỹ năng)\",\n"
                + "        \"Organization: +<điểm>/4 (Thứ tự các mục hợp lý)\"\n"
                + "      ]\n"
                + "    },\n"
                + "    \"content_quality\": {\n"
                + "      \"score\": <Tối đa 20>,\n"
                + "      \"details\": [\n"
                + "        \"Language: +<điểm>/5 (Ngữ pháp, động từ mạnh, từ vựng chuyên ngành)\",\n"
                + "        \"Quantification: +<điểm>/8 (Sử dụng số liệu định lượng, kết quả cụ thể)\",\n"
                + "        \"Keywords: +<điểm>/4 (Mức độ khớp từ khóa với JD)\",\n"
                + "        \"Consistency: +<điểm>/3 (Tính nhất quán về ngày tháng, format)\"\n"
                + "      ]\n"
                + "    }\n"
                + "  },\n"
                + "  \"stage3_in_depth\": {\n"
                + "    \"score\": <Tổng điểm GĐ 3 (Tối đa 40)>,\n"
                + "    \"experience_eval\": {\n"
                + "      \"score\": <Tối đa 20>,\n"
                + "      \"details\": [\n"
                + "        \"Progression: +<điểm>/4 (Sự thăng tiến, phát triển kỹ năng)\",\n"
                + "        \"Bullet Quality: +<điểm>/8 (Mô tả công việc rõ ràng, nêu rõ trách nhiệm)\",\n"
                + "        \"Scope & Impact: +<điểm>/8 (Phạm vi công việc và mức độ ảnh hưởng)\"\n"
                + "      ]\n"
                + "    },\n"
                + "    \"technical_evidence\": {\n"
                + "      \"score\": <Tối đa 10>,\n"
                + "      \"details\": [\"Chi tiết bằng chứng kỹ năng: +<điểm>/10\"]\n"
                + "    },\n"
                + "    \"projects\": {\n"
                + "      \"score\": <Tối đa 7>,\n"
                + "      \"details\": [\"Đánh giá chất lượng dự án: +<điểm>/7\"]\n"
                + "    },\n"
                + "    \"certs\": {\n"
                + "      \"score\": <Tối đa 3>,\n"
                + "      \"details\": [\"Bằng cấp, chứng chỉ liên quan: +<điểm>/3\"]\n"
                + "    }\n"
                + "  },\n"
                + "  \"stage4_bonus\": {\n"
                + "    \"score\": <Tối đa 10>,\n"
                + "    \"details\": [\n"
                + "      \"Leadership: +<điểm>/2\",\n"
                + "      \"International: +<điểm>/2\",\n"
                + "      \"Awards: +<điểm>/2\",\n"
                + "      \"Learning: +<điểm>/2\",\n"
                + "      \"Category-Specific: +<điểm>/2\"\n"
                + "    ]\n"
                + "  },\n"
                + "  \"sub_tips\": {\n"
                + "    \"file_technical\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"ats_parsability\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"typography\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"length\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"contact\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"summary\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"sections\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"organization\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"language\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"quantification\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"keywords\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"consistency\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"progression\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"bullet_quality\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"scope_impact\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"technical_evidence\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"projects\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"certs\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"leadership\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"international\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"awards\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"learning\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\",\n"
                + "    \"category_specific\": \"<tip ngắn ≤ 15 từ nếu điểm < 70% tối đa, ngược lại null>\"\n"
                + "  },\n"
                + "  \"strengths\": [\"<Liệt kê 2-3 điểm mạnh cốt lõi>\"],\n"
                + "  \"priority_actions\": [\n"
                + "    { \"action\": \"<Hành động 1>\", \"priority\": \"Cao\" },\n"
                + "    { \"action\": \"<Hành động 2>\", \"priority\": \"Trung bình\" }\n"
                + "  ]\n"
                + "}\n\n"
                + "BẮT BUỘC tuân thủ Rubric chấm điểm Stage 4 sau đây:\n"
                + "- Leadership (max 2đ): 0đ nếu không có, 1đ nếu mentor/lead nhóm nhỏ (<5 người hoặc <6 tháng), 2đ nếu quản lý team lớn >=5 người hoặc quản lý >=6 tháng hoặc giữ chức vụ Trưởng nhóm+.\n"
                + "- International (max 2đ): 0đ nếu nội địa, 1đ nếu có ngoại ngữ tốt (IELTS 6.5+/TOEIC 750+) hoặc làm việc nhóm đa quốc gia, 2đ nếu làm việc trực tiếp tại công ty nước ngoài hoặc IELTS 7.0+.\n"
                + "- Awards (max 2đ): 0đ nếu không có, 1đ nếu đạt giải nội bộ, cuộc thi nhỏ, 2đ nếu đạt giải cấp quốc gia/quốc tế hoặc được công nhận bởi tổ chức uy tín.\n"
                + "- Learning (max 2đ): 0đ nếu không có bằng chứng tự học, 1đ nếu có chứng chỉ online lẻ hoặc học công nghệ mới, 2đ nếu có chuỗi chứng chỉ học tập liên tục hoặc contribute open source hoặc blog kỹ thuật.\n"
                + "- Category-Specific (max 2đ): 0đ nếu không có portfolio/bằng chứng chuyên ngành, 1đ nếu có portfolio/GitHub nhưng sơ sài, 2đ nếu portfolio cực mạnh bám sát vị trí (IT->GitHub active, Design->Behance, Marketing->Case study chi tiết, Finance->CFA/CPA/số liệu P&L, Sales->Revenue quota attainment).\n\n"
                + "Lưu ý: Toàn bộ JSON trả về phải sử dụng Tiếng Việt cho các mô tả (details, strengths, actions, sub_tips). Quy tắc lọc sub_tips: Sinh dữ liệu tip cá nhân hóa sâu sắc (bám sát theo ngành nghề, vai trò, trình độ và thể loại CV cụ thể) cho tất cả các sub-item chưa đạt điểm tối đa (current < max). Nếu đã đạt tối đa thì trả về null. Phân tích thật sâu.\n\nQUY TẮC PHÁT HIỆN GIAN LẬN (Credibility Audit): Đánh giá xem ứng viên có dùng thủ thuật như nhồi nhét từ khóa vô nghĩa (keyword stuffing), sao chép nguyên bản mô tả JD, hoặc ghi lệch thời gian không. Nếu phát hiện nghi vấn, hãy trừ điểm thẳng tay tại mục Keywords hoặc Consistency (Stage 2) và bắt buộc thêm một hành động cảnh báo mức độ 'Cao' trong 'priority_actions' có tiền tố '⚠️ PHÁT HIỆN NGHI VẤN GIAN LẬN: <chi tiết>'.";
                Map<String, Object> generationConfig = Map.of(
                                "temperature", 0.1,
                                "responseMimeType", "application/json");
                return callTextOnlyGemini(promptText, 25, generationConfig);
    }

    private String callTextOnlyGemini(String promptText, int timeoutSeconds) {
        return callTextOnlyGemini(promptText, timeoutSeconds, null);
    }

    private String callTextOnlyGemini(String promptText, int timeoutSeconds, Map<String, Object> generationConfig) {
                Map<String, Object> requestBody;
                if (generationConfig != null) {
                    requestBody = Map.of(
                                    "contents", List.of(
                                                    Map.of("parts", List.of(
                                                                    Map.of("text", promptText)))),
                                    "generationConfig", generationConfig);
                } else {
                    requestBody = Map.of(
                                    "contents", List.of(
                                                    Map.of("parts", List.of(
                                                                    Map.of("text", promptText)))));
                }

                try {
                        log.info("Sending text-only request to Gemini API with {}s timeout...", timeoutSeconds);
                        String responseStr = webClient.post()
                                        .uri(apiUrl + "?key=" + apiKey)
                                        .bodyValue(requestBody)
                                        .retrieve()
                                        .bodyToMono(String.class)
                                        .timeout(Duration.ofSeconds(timeoutSeconds))
                                        .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                                            .filter(ex -> ex instanceof TimeoutException || ex instanceof WebClientResponseException.TooManyRequests || ex instanceof WebClientResponseException.InternalServerError))
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
