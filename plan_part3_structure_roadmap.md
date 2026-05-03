# AI-Hire: Part 3 - Cấu trúc dự án, Docker & Lộ trình

## 8. Cấu trúc thư mục dự án

```
d:\java\ai-hire\
├── docker-compose.yml          # MySQL + Redis + RabbitMQ + MinIO
│
├── ai-hire-backend\            # Spring Boot
│   ├── pom.xml
│   └── src\main\java\com\tuna\aihire\
│       ├── AiHireApplication.java
│       │
│       ├── config\
│       │   ├── SecurityConfig.java        # Spring Security + JWT filter
│       │   ├── WebSocketConfig.java       # STOMP WebSocket
│       │   ├── RabbitMQConfig.java        # Queue declarations
│       │   ├── MinIOConfig.java           # S3 client config
│       │   ├── RedisConfig.java
│       │   ├── SwaggerConfig.java         # OpenAPI docs
│       │   └── CorsConfig.java
│       │
│       ├── domain\
│       │   ├── User.java
│       │   ├── Company.java
│       │   ├── Job.java
│       │   ├── JobCriteria.java
│       │   ├── Resume.java
│       │   ├── Application.java
│       │   ├── AiScore.java
│       │   ├── Interview.java
│       │   ├── InterviewMessage.java
│       │   │
│       │   ├── enums\
│       │   │   ├── UserRole.java          # CANDIDATE, HR, ADMIN
│       │   │   ├── JobType.java           # FULLTIME, PARTTIME, REMOTE, INTERN
│       │   │   ├── JobStatus.java         # OPEN, CLOSED, DRAFT
│       │   │   ├── ParseStatus.java       # PENDING, PROCESSING, DONE, FAILED
│       │   │   ├── ApplicationStatus.java # SUBMITTED → HIRED pipeline
│       │   │   ├── InterviewStatus.java
│       │   │   └── HireRecommendation.java
│       │   │
│       │   ├── request\                   # DTOs for request body
│       │   │   ├── ReqLoginDTO.java
│       │   │   ├── ReqRegisterDTO.java
│       │   │   ├── ReqCreateJobDTO.java
│       │   │   ├── ReqJobCriteriaDTO.java
│       │   │   ├── ReqApplicationDTO.java
│       │   │   └── ReqInterviewAnswerDTO.java
│       │   │
│       │   └── response\                  # DTOs for response
│       │       ├── ResLoginDTO.java
│       │       ├── ResUserDTO.java
│       │       ├── ResJobDTO.java
│       │       ├── ResResumeDTO.java
│       │       ├── ResAiScoreDTO.java
│       │       ├── ResApplicationDTO.java
│       │       ├── ResInterviewDTO.java
│       │       └── ResPaginationDTO.java
│       │
│       ├── repository\
│       │   ├── UserRepository.java
│       │   ├── CompanyRepository.java
│       │   ├── JobRepository.java
│       │   ├── JobCriteriaRepository.java
│       │   ├── ResumeRepository.java
│       │   ├── ApplicationRepository.java
│       │   ├── AiScoreRepository.java
│       │   ├── InterviewRepository.java
│       │   └── InterviewMessageRepository.java
│       │
│       ├── service\
│       │   ├── AuthService.java
│       │   ├── UserService.java
│       │   ├── CompanyService.java
│       │   ├── JobService.java
│       │   ├── ResumeService.java         # Upload + Tika parsing
│       │   ├── ApplicationService.java
│       │   ├── AiScoringService.java      # Core: Gemini scoring logic
│       │   ├── AiInterviewService.java    # Core: Gemini interview logic
│       │   ├── FileStorageService.java    # MinIO operations
│       │   ├── NotificationService.java   # WebSocket + Email
│       │   └── EmailService.java          # Brevo integration
│       │
│       ├── consumer\
│       │   ├── CVProcessingConsumer.java   # RabbitMQ: parse + score CV
│       │   └── ReportGenerationConsumer.java
│       │
│       ├── controller\
│       │   ├── AuthController.java
│       │   ├── UserController.java
│       │   ├── JobController.java
│       │   ├── ResumeController.java
│       │   ├── ApplicationController.java
│       │   ├── AiController.java
│       │   ├── InterviewController.java
│       │   └── InterviewWebSocketController.java
│       │
│       ├── security\
│       │   ├── JwtTokenProvider.java
│       │   ├── JwtAuthFilter.java
│       │   └── CustomUserDetailsService.java
│       │
│       └── exception\
│           ├── GlobalExceptionHandler.java
│           ├── ResourceNotFoundException.java
│           ├── FileProcessingException.java
│           └── AiServiceException.java
│
├── ai-hire-ui\                 # React + Vite + TypeScript
│   ├── package.json
│   ├── vite.config.ts
│   └── src\
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css               # Design system (colors, typography)
│       │
│       ├── api\
│       │   ├── axiosClient.ts       # Interceptors + JWT refresh
│       │   ├── authApi.ts
│       │   ├── jobApi.ts
│       │   ├── resumeApi.ts
│       │   ├── applicationApi.ts
│       │   └── interviewApi.ts
│       │
│       ├── types\
│       │   ├── user.type.ts
│       │   ├── job.type.ts
│       │   ├── resume.type.ts
│       │   ├── application.type.ts
│       │   ├── aiScore.type.ts
│       │   └── interview.type.ts
│       │
│       ├── components\
│       │   ├── layout\
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── Footer.tsx
│       │   ├── common\
│       │   │   ├── LoadingSpinner.tsx
│       │   │   ├── ScoreRadarChart.tsx    # Biểu đồ radar 4 metrics
│       │   │   ├── ScoreProgressBar.tsx   # Thanh điểm 0-100
│       │   │   ├── SkillBadge.tsx         # Tag hiển thị kỹ năng
│       │   │   ├── FileUploader.tsx       # Drag & drop CV
│       │   │   ├── KanbanBoard.tsx        # Pipeline kéo thả
│       │   │   └── DataTable.tsx          # Bảng có sort, filter, pagination
│       │   └── interview\
│       │       ├── ChatBubble.tsx
│       │       ├── AiTypingIndicator.tsx
│       │       └── InterviewTimer.tsx
│       │
│       ├── pages\
│       │   ├── public\
│       │   │   ├── Landing.tsx
│       │   │   ├── Login.tsx
│       │   │   ├── Register.tsx
│       │   │   ├── JobListing.tsx
│       │   │   └── JobDetail.tsx
│       │   ├── candidate\
│       │   │   ├── CandidateDashboard.tsx
│       │   │   ├── MyResumes.tsx
│       │   │   ├── CVAnalysis.tsx          # ★ Trang quan trọng nhất
│       │   │   ├── MyApplications.tsx
│       │   │   ├── AiInterview.tsx
│       │   │   └── InterviewResult.tsx
│       │   └── hr\
│       │       ├── HRDashboard.tsx
│       │       ├── CompanyProfile.tsx
│       │       ├── JobManagement.tsx
│       │       ├── CreateEditJob.tsx
│       │       ├── ApplicantList.tsx       # ★ Trang quan trọng nhất
│       │       ├── ApplicantDetail.tsx
│       │       └── RecruitmentPipeline.tsx
│       │
│       ├── hooks\
│       │   ├── useWebSocket.ts
│       │   ├── useAuth.ts
│       │   └── useFileUpload.ts
│       │
│       └── context\
│           ├── AuthContext.tsx
│           └── NotificationContext.tsx
```

---

## 9. Docker Compose

```yaml
# d:\java\ai-hire\docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: aihire-mysql
    ports:
      - "3307:3306"           # 3307 để không xung đột với ecom
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: aihire
    volumes:
      - aihire_mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    container_name: aihire-redis
    ports:
      - "6380:6379"           # 6380 để không xung đột
    command: redis-server --requirepass redis123

  rabbitmq:
    image: rabbitmq:3-management
    container_name: aihire-rabbitmq
    ports:
      - "5672:5672"           # AMQP protocol
      - "15672:15672"         # Management UI (http://localhost:15672)
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123

  minio:
    image: minio/minio
    container_name: aihire-minio
    ports:
      - "9000:9000"           # S3 API
      - "9001:9001"           # Console UI (http://localhost:9001)
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    volumes:
      - aihire_minio_data:/data

volumes:
  aihire_mysql_data:
  aihire_minio_data:
```

---

## 10. Lộ trình triển khai (5 Phases)

### Phase 1: Foundation (Tuần 1-2)
> Mục tiêu: Chạy được Backend + Frontend cơ bản, đăng nhập/đăng ký

| Task | Chi tiết |
|------|----------|
| Docker Compose | Chạy MySQL + Redis + RabbitMQ + MinIO |
| Spring Boot init | Tạo project, config DB, Security, JWT |
| Auth APIs | Register, Login, Refresh Token, Google OAuth |
| User CRUD | Profile management cho Candidate + HR |
| React init | Vite + TypeScript, routing, design system |
| Auth UI | Landing, Login, Register pages |

**Deliverable:** Đăng ký → Đăng nhập → Thấy Dashboard trống

---

### Phase 2: Job & CV Management (Tuần 3-4) ⭐ PRIORITY
> Mục tiêu: HR đăng JD với tiêu chí, Candidate upload CV

| Task | Chi tiết |
|------|----------|
| Company Entity | HR tạo Company profile |
| Job CRUD APIs | Tạo/sửa/xóa JD |
| JobCriteria | HR thiết lập tiêu chí chấm điểm riêng cho mỗi JD |
| MinIO Service | Upload/download file |
| Resume Upload | API upload CV (PDF/Docx) → lưu MinIO |
| Apache Tika | Parse PDF/Docx → extracted_text |
| RabbitMQ | CV processing queue + consumer |
| Frontend Job | Job listing, search, filter, create/edit |
| Frontend CV | File uploader (drag & drop), resume list |

**Deliverable:** HR đăng JD → Candidate upload CV → File được parse thành text

---

### Phase 3: AI Scoring Engine (Tuần 5-6) ⭐⭐ TOP PRIORITY
> Mục tiêu: AI chấm điểm CV theo JD, gợi ý cải thiện

| Task | Chi tiết |
|------|----------|
| AiScoringService | Xây dựng prompt, gọi Gemini, parse JSON response |
| Scoring Rubric | Tính điểm theo 4 tiêu chí + trọng số của HR |
| AI Improvement | Prompt gợi ý cải thiện CV cụ thể |
| AI CV Fixer | Prompt viết lại các phần yếu của CV |
| Redis Cache | Cache kết quả AI (cùng CV + JD = không gọi lại) |
| Error Handling | Retry, Dead Letter Queue, Circuit Breaker |
| WebSocket Notify | Thông báo real-time khi AI chấm xong |
| Application API | Candidate nộp đơn ứng tuyển (CV → Job) |
| CV Analysis UI | ★ Trang điểm số + radar chart + gợi ý |
| Applicant List UI | ★ Bảng ứng viên ranked by score |

**Deliverable:** Upload CV → AI chấm 78/100 → Gợi ý "Thêm Docker" → HR thấy bảng xếp hạng

---

### Phase 4: AI Interview (Tuần 7-8)
> Mục tiêu: Ứng viên phỏng vấn trực tiếp với AI qua chat

| Task | Chi tiết |
|------|----------|
| AiInterviewService | Adaptive questioning logic |
| WebSocket Chat | STOMP endpoint cho real-time chat |
| Interview Session | Quản lý state: câu hỏi hiện tại, điểm, thời gian |
| Answer Evaluation | AI chấm từng câu trả lời (0-10) |
| Final Report | AI tổng kết: rating, hire recommendation |
| Interview UI | Chat interface, typing indicator, timer |
| Result UI | Báo cáo kết quả, biểu đồ |
| HR Review UI | HR xem lại transcript + đánh giá AI |

**Deliverable:** Candidate chat 8 câu → AI chấm 85/100 → Gợi ý "STRONG YES"

---

### Phase 5: Dashboard & Polish (Tuần 9-10)
> Mục tiêu: Thống kê, Kanban pipeline, tối ưu UX

| Task | Chi tiết |
|------|----------|
| Candidate Dashboard | Tổng quan đơn ứng tuyển, điểm trung bình |
| HR Dashboard | Thống kê top skills, số ứng viên, tỷ lệ match |
| Kanban Board | Pipeline: Applied → Screening → Interview → Offer |
| Email Notifications | Gửi email khi có kết quả mới (Brevo) |
| Export CSV | HR xuất danh sách ứng viên |
| Responsive | Tối ưu mobile |
| Performance | Lazy loading, pagination, query optimization |
| Swagger | API documentation hoàn chỉnh |

---

## 11. Verification Plan (Kiểm thử)

### Unit Tests
- `AiScoringServiceTest`: Test parse JSON response từ Gemini
- `ResumeServiceTest`: Test Tika parse các loại file (PDF, Docx, file lỗi)
- `JwtTokenProviderTest`: Test token generation & validation

### Integration Tests
- Upload CV → RabbitMQ → Consumer → AI Score xuất hiện trong DB
- WebSocket: Client connect → nhận notification khi score xong
- Auth flow: Register → Login → Access protected endpoint

### E2E Tests (Browser)
- Candidate flow: Register → Upload CV → Xem điểm → Ứng tuyển → Phỏng vấn AI
- HR flow: Register → Tạo JD + Tiêu chí → Xem ứng viên → Xem transcript phỏng vấn

### Performance
- Stress test: 50 CV upload cùng lúc → tất cả đều được xử lý (qua RabbitMQ)
- AI response time: < 15 giây cho mỗi lần scoring

---

## 12. Câu hỏi cần xác nhận trước khi bắt đầu

> [!IMPORTANT]
> 1. Bạn muốn dùng **Maven** hay **Gradle**? (Khuyên Maven)
> 2. Folder dự án đặt tại `d:\java\ai-hire\` có OK không?
> 3. Bạn đã cài **Docker Desktop** trên máy chưa? (Cần cho MySQL, Redis, RabbitMQ, MinIO)
> 4. Bạn muốn bắt đầu từ **Phase 1 (Foundation)** ngay bây giờ không?
