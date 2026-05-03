# 🚀 AI-Hire: Next-Gen AI Recruitment Platform

AI-Hire là một nền tảng tuyển dụng hiện đại, ứng dụng trí tuệ nhân tạo (Generative AI) để tự động hóa quy trình sàng lọc ứng viên, phân tích CV và so khớp hồ sơ với mô tả công việc (JD) một cách chính xác nhất.

## ✨ Tính năng nổi bật

- **🔐 Bảo mật đa tầng:** Hệ thống Authentication/Authorization sử dụng JWT (Access & Refresh Token) kết hợp cùng Spring Security.
- **🛡️ Phân quyền động (Dynamic RBAC):** Quản lý Role và Permission linh hoạt dựa trên Database, hỗ trợ Interceptor để kiểm soát quyền truy cập API thời gian thực.
- **🤖 AI-Powered CV Parsing:** Sử dụng **Gemini AI** để trích xuất thông tin từ CV (PDF/Docx) sang định dạng JSON chuẩn.
- **📊 AI Scoring & Matching:** Tự động chấm điểm độ phù hợp giữa ứng viên và công việc dựa trên kỹ năng, kinh nghiệm và yêu cầu của JD.
- **📥 Quản lý File tập trung:** Tích hợp **MinIO** (Object Storage) để lưu trữ hồ sơ ứng viên an toàn và hiệu suất cao.
- **⚡ Xử lý bất đồng bộ:** Sử dụng **RabbitMQ** để xử lý các tác vụ nặng (như parse CV, gửi mail) mà không gây nghẽn hệ thống.
- **🔍 Advanced Filtering:** Tìm kiếm ứng viên và tin tuyển dụng cực mạnh với thư viện **spring-filter**.
- **🚀 Caching:** Tối ưu hóa hiệu năng với **Redis**.

## 🛠️ Công nghệ sử dụng

- **Backend:** Spring Boot.
- **Security:** Spring Security, OAuth2 Resource Server.
- **Database:** MySQL (Persistence), Redis (Cache).
- **Message Broker:** RabbitMQ.
- **Storage:** MinIO.
- **AI Integration:** Google Gemini AI API.
- **Documentation:** Swagger UI / OpenAPI 3.0.
- **Others:** Apache Tika (Content Extraction), Lombok, MapStruct.

## 🏗️ Kiến trúc hệ thống

Dự án tuân thủ kiến trúc phân lớp chuẩn (Layered Architecture):
- **Controller Layer:** Tiếp nhận và điều phối các Request.
- **Service Layer:** Xử lý logic nghiệp vụ và tích hợp AI.
- **Repository Layer:** Giao tiếp với Database qua Spring Data JPA.
- **DTO Layer:** Chuyển đổi dữ liệu an toàn giữa các lớp, bảo vệ thông tin nhạy cảm.

## 🚀 Hướng dẫn cài đặt

1. **Clone project:**
   ```bash
   git clone https://github.com/your-username/AIH.git
   ```
2. **Cấu hình môi trường:**
   - Cài đặt và chạy Docker (MySQL, Redis, RabbitMQ, MinIO).
   - Cập nhật thông tin kết nối trong `src/main/resources/application.yml`.
3. **Chạy ứng dụng:**
   ```bash
   mvn spring-boot:run
   ```

## 📝 Tài liệu API

Sau khi khởi chạy, bạn có thể truy cập Swagger UI tại:
`http://localhost:8080/swagger-ui.html`

---
⭐ **AI-Hire** - *Cách mạng hóa quy trình tuyển dụng bằng trí tuệ nhân tạo.*
