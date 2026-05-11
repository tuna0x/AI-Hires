package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.models.*;
import com.project.AIH.repositories.*;
import com.project.AIH.utils.constant.*;
import com.project.AIH.dto.CvScoringMessage;
import com.project.AIH.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.project.AIH.dto.ResultPaginationDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.apache.tika.Tika;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResumeService {

    private final FileService fileService;
    private final ResumeParserService parserService;
    private final GeminiService geminiService;
    private final ScanMapperService scanMapperService;
    
    private final ResumeRepository resumeRepository;
    private final ResumeScanRepository resumeScanRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final CvScoreRepository cvScoreRepository;
    private final ObjectMapper objectMapper;
    private final RabbitTemplate rabbitTemplate;
    private final ResumeRawAiOutputRepository rawAiOutputRepository;

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File không có nội dung.");
        }
        if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File quá lớn. Tối đa 10MB.");
        }
        try {
            Tika tika = new Tika();
            String detectedMime = tika.detect(file.getInputStream());
            if (!detectedMime.equals("application/pdf") && 
                !detectedMime.equals("application/msword") && 
                !detectedMime.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận file PDF hoặc Word.");
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể đọc định dạng file.");
        }
    }

    @Transactional
    public Application applyAndScore(MultipartFile file, Long jobId, User user) {
        log.info("Starting CV application and scoring for user: {} and job: {}", user.getEmail(), jobId);
        validateFile(file);

        // 1. Upload CV to MinIO
        String fileName = fileService.uploadFile(file, "resumes/" + user.getId());

        // 2. Extract Text from CV
        String extractedText = "";
        try {
            extractedText = parserService.extractText(file.getInputStream());
        } catch (Exception e) {
            log.error("Failed to extract text: {}", e.getMessage());
        }

        String contentHash = calculateFileHash(extractedText.getBytes());

        // 3. Save Resume record
        Resume resume = Resume.builder()
                .user(user)
                .fileUrl(fileName)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .contentHash(contentHash)
                .parseStatus(ResumeStatusEnum.PROCESSING)
                .build();
        resume = resumeRepository.save(resume);

        final Long resumeId = resume.getId();
        final String finalExtractedText = extractedText;
        CompletableFuture.runAsync(() -> {
            try {
                log.info("Starting background detailed parsing for resume ID: {}", resumeId);
                Resume bgResume = resumeRepository.findById(resumeId).orElse(null);
                if (bgResume != null) {
                    parseAndPopulateDetailedResume(bgResume, finalExtractedText);
                    resumeRepository.save(bgResume);
                    log.info("Finished background detailed parsing for resume ID: {}", resumeId);
                }
            } catch (Exception e) {
                log.error("Async detailed parsing failed for resume ID: {}", resumeId, e);
            }
        });

        // 4. Create Application
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        Application application = Application.builder()
                .job(job)
                .resume(resume)
                .status(ApplicationStatusEnum.AI_SCREENING)
                .build();
        application = applicationRepository.save(application);

        // 5. Send message to RabbitMQ for asynchronous processing
        try {
            CvScoringMessage message = CvScoringMessage.builder()
                    .applicationId(application.getId())
                    .resumeId(resume.getId())
                    .jobId(job.getId())
                    .fileUrl(fileName)
                    .contentType(file.getContentType())
                    .build();

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.CV_SCORING_EXCHANGE,
                    RabbitMQConfig.CV_SCORING_ROUTING_KEY,
                    message
            );
            log.info("Sent CV Scoring message to queue for application: {}", application.getId());
        } catch (Exception e) {
            log.error("Failed to send message to queue: {}", e.getMessage());
            resume.setParseStatus(ResumeStatusEnum.FAILED);
        }

        resumeRepository.save(resume);
        return application;
    }

    @Transactional(readOnly = true)
    public Resume getResumeById(Long id) {
        return resumeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ."));
    }

    public Resume uploadAndParse(MultipartFile file, User user) {
        String userEmail = (user != null) ? user.getEmail() : "anonymous";
        String folderPath = (user != null) ? "resumes/" + user.getId() : "resumes/guest";
        log.info("Uploading and parsing resume for user: {}", userEmail);

        // Validate file FIRST
        validateFile(file);

        // 1. Read file bytes and extract text BEFORE anything else (to get the content hash)
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            fileBytes = new byte[0];
        }

        String extractedText = "";
        try {
            extractedText = parserService.extractText(file.getInputStream());
        } catch (Exception e) {
            log.error("Failed to extract text: {}", e.getMessage());
        }

        // Calculate hash based on CONTENT (extracted text) to prevent cross-user leak
        String contentHash = calculateFileHash(extractedText.getBytes());

        // Check if we have an existing CV with this content hash for THIS user
        if (user != null) {
            java.util.Optional<Resume> existingResume = resumeRepository.findByUserIdAndContentHash(user.getId(), contentHash);
            if (existingResume.isPresent()) {
                log.info("Found cached Resume (ID: {}) for the same user and content hash: {}", existingResume.get().getId(), contentHash);
                return existingResume.get();
            }
        }

        // 2. Upload CV to MinIO synchronously (takes <100ms, essential to ensure fileUrl exists)
        String fileName;
        try {
            fileName = fileService.uploadFile(file, folderPath);
        } catch (Exception e) {
            log.error("Failed to upload file to MinIO: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tải tệp lên hệ thống lưu trữ.");
        }

        // 3. Create and Save Resume with PROCESSING status
        Resume resume = Resume.builder()
                .user(user)
                .fileUrl(fileName)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .contentHash(contentHash)
                .parseStatus(ResumeStatusEnum.PROCESSING)
                .build();
        resume = resumeRepository.save(resume);

        final Long resumeId = resume.getId();
        final String finalExtractedText = extractedText;
        final byte[] finalFileBytes = fileBytes;
        final String contentType = file.getContentType();
        final String finalFileName = fileName;
        final String finalContentHash = contentHash;

        // 4. Heavy AI analysis run asynchronously in the background
        CompletableFuture.runAsync(() -> {
            try {
                log.info("Starting background processing for resume ID: {}", resumeId);

                // Parallel AI Analysis
                CompletableFuture<String> generalAnalysisFuture = CompletableFuture.supplyAsync(() -> {
                    try {
                        if (isTextCorrupted(finalExtractedText)) {
                            log.info("Extracted text is empty or corrupted. Falling back to Gemini Vision using file bytes.");
                            return geminiService.parseResume(finalFileBytes, contentType);
                        } else {
                            log.info("Extracted text is of high quality. Calling Gemini with text thô for high speed.");
                            return geminiService.parseResumeText(finalExtractedText);
                        }
                    } catch (Exception e) {
                        log.error("Parallel AI General Analysis failed: {}", e.getMessage(), e);
                        return "";
                    }
                });

                CompletableFuture<String> detailedStructureFuture = CompletableFuture.supplyAsync(() -> {
                    try {
                        if (finalExtractedText == null || finalExtractedText.trim().isEmpty()) {
                            return "";
                        }
                        log.info("Calling Gemini in parallel to parse detailed resume structure.");
                        return geminiService.parseDetailedResume(finalExtractedText);
                    } catch (Exception e) {
                        log.error("Parallel AI Detailed Structure Parsing failed: {}", e.getMessage(), e);
                        return "";
                    }
                });

                // Wait for both tasks with strict TIMEOUT of 25 seconds
                try {
                    CompletableFuture.allOf(generalAnalysisFuture, detailedStructureFuture)
                            .orTimeout(25, TimeUnit.SECONDS)
                            .join();
                } catch (Exception e) {
                    log.error("Timeout or error during parallel Gemini execution: {}", e.getMessage(), e);
                }

                String parsedData = "";
                String detailedJson = "";
                try {
                    parsedData = generalAnalysisFuture.getNow("");
                    if (parsedData != null && !parsedData.isEmpty()) {
                        parsedData = scanMapperService.enrichAndCalculateGaps(parsedData);
                    }
                } catch (Exception e) {
                    log.error("Failed to retrieve general analysis: {}", e.getMessage());
                }

                try {
                    detailedJson = detailedStructureFuture.getNow("");
                } catch (Exception e) {
                    log.error("Failed to retrieve detailed structure: {}", e.getMessage());
                }

                // Retrieve fresh instance of resume in this background thread
                Resume bgResume = resumeRepository.findById(resumeId).orElse(null);
                if (bgResume == null) {
                    log.error("Resume ID {} not found in database.", resumeId);
                    return;
                }

                // Save Raw JSON to ResumeRawAiOutput instead of Resume.parsedData
                if (!parsedData.isEmpty() || !detailedJson.isEmpty()) {
                    try {
                        ResumeRawAiOutput rawOutput = ResumeRawAiOutput.builder()
                                .resume(bgResume)
                                .atsJson(parsedData)
                                .profileJson(detailedJson)
                                .aiModel("gemini-3.1-flash-lite-preview")
                                .promptVersion("v1.0")
                                .build();
                        rawAiOutputRepository.save(rawOutput);
                        bgResume.setRawAiOutput(rawOutput);
                    } catch (Exception e) {
                        log.error("Failed to save raw AI output: {}", e.getMessage());
                    }
                }

                // Populate detailed properties from parallel JSON response
                if (detailedJson != null && !detailedJson.isEmpty()) {
                    populateDetailedResumeFromJson(bgResume, detailedJson);
                }

                bgResume.setParseStatus(parsedData.isEmpty() ? ResumeStatusEnum.FAILED : ResumeStatusEnum.DONE);
                bgResume = resumeRepository.save(bgResume);

                // 5. Structure and Save in the normalized database schema
                if (!parsedData.isEmpty()) {
                    try {
                        scanMapperService.saveScanResult(user, finalFileName, finalContentHash, parsedData);
                    } catch (Exception e) {
                        log.error("Failed to save scan results in structured tables: {}", e.getMessage());
                    }
                }
                log.info("Finished background processing successfully for resume ID: {}", resumeId);

            } catch (Exception e) {
                log.error("Background processing failed for resume ID: {}", resumeId, e);
                try {
                    Resume bgResume = resumeRepository.findById(resumeId).orElse(null);
                    if (bgResume != null) {
                        bgResume.setParseStatus(ResumeStatusEnum.FAILED);
                        resumeRepository.save(bgResume);
                    }
                } catch (Exception ex) {
                    log.error("Failed to set FAILED status for resume ID: {}", resumeId, ex);
                }
            }
        });

        return resume;
    }

    private boolean isTextCorrupted(String extractedText) {
        if (extractedText == null || extractedText.trim().length() < 300) {
            return true; // PDF Scan hoặc ảnh rỗng
        }
        // Kiểm tra xem có chứa @ (email) hoặc số điện thoại hay không để xác minh không bị lỗi font/mã hóa
        if (!extractedText.contains("@") && !extractedText.matches(".*\\d{9,11}.*")) {
            return true; // Thiếu email và SĐT, nhiều khả năng text bị vỡ hoặc lỗi font nặng
        }
        return false;
    }

    @Transactional(readOnly = true)
    public ResultPaginationDTO getResumesByUser(Specification<Resume> spec, Pageable pageable, User user) {
        log.info("Fetching paginated resumes for user ID: {}", user.getId());

        // Secure boundary: Force filtering by current user
        Specification<Resume> combinedSpec = (root, query, cb) -> cb.equal(root.get("user").get("id"), user.getId());
        if (spec != null) {
            combinedSpec = combinedSpec.and(spec);
        }

        Page<Resume> pageResume = resumeRepository.findAll(combinedSpec, pageable);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageResume.getNumber() + 1);
        meta.setPageSize(pageResume.getSize());
        meta.setPages(pageResume.getTotalPages());
        meta.setTotal(pageResume.getTotalElements());
        rs.setMeta(meta);
        rs.setResult(pageResume.getContent());

        return rs;
    }

    private String calculateFileHash(byte[] fileBytes) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fileBytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return java.util.UUID.randomUUID().toString();
        }
    }

    private void parseAndPopulateDetailedResume(Resume resume, String extractedText) {
        if (extractedText == null || extractedText.trim().isEmpty()) {
            log.warn("Extracted text is empty, skipping detailed structured resume parsing.");
            return;
        }

        try {
            log.info("Calling Gemini to parse detailed resume structure for resume ID: {}", resume.getId());
            String responseJson = geminiService.parseDetailedResume(extractedText);
            populateDetailedResumeFromJson(resume, responseJson);
        } catch (Exception e) {
            log.error("Failed to parse detailed resume structure for resume ID: {}. Error: {}", resume.getId(), e.getMessage());
        }
    }

    private void populateDetailedResumeFromJson(Resume resume, String responseJson) {
        if (responseJson == null || responseJson.trim().isEmpty()) {
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(responseJson);

            // 1. Basic Info
            JsonNode basicNode = root.path("basicInfo");
            if (!basicNode.isMissingNode() && !basicNode.isNull()) {
                resume.setFullName(basicNode.path("fullName").asText(null));
                resume.setEmail(basicNode.path("email").asText(null));
                resume.setPhone(basicNode.path("phone").asText(null));
                resume.setAddress(basicNode.path("address").asText(null));
                resume.setDateOfBirth(parseLocalDate(basicNode.path("dateOfBirth").asText(null)));
                resume.setLinkedinUrl(basicNode.path("linkedinUrl").asText(null));
                resume.setGithubUrl(basicNode.path("githubUrl").asText(null));
                resume.setPortfolioUrl(basicNode.path("portfolioUrl").asText(null));
                resume.setObjective(basicNode.path("objective").asText(null));
                resume.setPredictedLevel(parseEnum(CandidateLevelEnum.class, basicNode.path("predictedLevel").asText(null), null));
                resume.setPredictedIndustry(basicNode.path("predictedIndustry").asText(null));
            }

            // 2. Skills
            JsonNode skillsNode = root.path("skills");
            if (skillsNode.isArray()) {
                List<ResumeSkill> skills = new ArrayList<>();
                for (JsonNode n : skillsNode) {
                    skills.add(ResumeSkill.builder()
                            .resume(resume)
                            .skillName(n.path("skillName").asText(""))
                            .category(parseEnum(SkillCategoryEnum.class, n.path("category").asText(null), SkillCategoryEnum.TECHNICAL))
                            .proficiencyLevel(parseEnum(ProficiencyLevelEnum.class, n.path("proficiencyLevel").asText(null), ProficiencyLevelEnum.INTERMEDIATE))
                            .yearsOfExperience(parseBigDecimal(n.path("yearsOfExperience").asText(null)))
                            .build());
                }
                resume.setSkills(skills);
            }

            // 3. Experiences
            JsonNode expNode = root.path("experiences");
            if (expNode.isArray()) {
                List<ResumeExperience> experiences = new ArrayList<>();
                int order = 0;
                for (JsonNode n : expNode) {
                    experiences.add(ResumeExperience.builder()
                            .resume(resume)
                            .companyName(n.path("companyName").asText(""))
                            .position(n.path("position").asText(""))
                            .location(n.path("location").asText(null))
                            .startDate(parseLocalDate(n.path("startDate").asText(null)))
                            .endDate(parseLocalDate(n.path("endDate").asText(null)))
                            .isCurrent(n.path("isCurrent").asBoolean(false))
                            .description(n.path("description").asText(""))
                            .achievements(n.path("achievements").asText(null))
                            .displayOrder(order++)
                            .build());
                }
                resume.setExperiences(experiences);
            }

            // 4. Educations
            JsonNode eduNode = root.path("educations");
            if (eduNode.isArray()) {
                List<ResumeEducation> educations = new ArrayList<>();
                int order = 0;
                for (JsonNode n : eduNode) {
                    educations.add(ResumeEducation.builder()
                            .resume(resume)
                            .institutionName(n.path("institutionName").asText(""))
                            .degree(n.path("degree").asText(null))
                            .fieldOfStudy(n.path("fieldOfStudy").asText(null))
                            .startDate(parseLocalDate(n.path("startDate").asText(null)))
                            .endDate(parseLocalDate(n.path("endDate").asText(null)))
                            .gpa(parseBigDecimal(n.path("gpa").asText(null)))
                            .description(n.path("description").asText(null))
                            .displayOrder(order++)
                            .build());
                }
                resume.setEducations(educations);
            }

            // 5. Certifications
            JsonNode certNode = root.path("certifications");
            if (certNode.isArray()) {
                List<ResumeCertification> certifications = new ArrayList<>();
                for (JsonNode n : certNode) {
                    certifications.add(ResumeCertification.builder()
                            .resume(resume)
                            .name(n.path("name").asText(""))
                            .issuingOrganization(n.path("issuingOrganization").asText(null))
                            .issueDate(parseLocalDate(n.path("issueDate").asText(null)))
                            .expiryDate(parseLocalDate(n.path("expiryDate").asText(null)))
                            .credentialUrl(n.path("credentialUrl").asText(null))
                            .build());
                }
                resume.setCertifications(certifications);
            }

            // 6. Projects
            JsonNode projNode = root.path("projects");
            if (projNode.isArray()) {
                List<ResumeProject> projects = new ArrayList<>();
                for (JsonNode n : projNode) {
                    String techStr = n.path("technologies").asText("");
                    List<String> techList = new ArrayList<>();
                    if (techStr != null && !techStr.trim().isEmpty()) {
                        for (String t : techStr.split(",")) {
                            String trimmed = t.trim();
                            if (!trimmed.isEmpty()) {
                                techList.add(trimmed);
                            }
                        }
                    }

                    projects.add(ResumeProject.builder()
                            .resume(resume)
                            .name(n.path("name").asText(""))
                            .role(n.path("role").asText(""))
                            .technologies(techList)
                            .description(n.path("description").asText(""))
                            .url(n.path("url").asText(null))
                            .startDate(parseLocalDate(n.path("startDate").asText(null)))
                            .endDate(parseLocalDate(n.path("endDate").asText(null)))
                            .build());
                }
                resume.setProjects(projects);
            }

            // 7. Languages
            JsonNode langNode = root.path("languages");
            if (langNode.isArray()) {
                List<ResumeLanguage> languages = new ArrayList<>();
                for (JsonNode n : langNode) {
                    languages.add(ResumeLanguage.builder()
                            .resume(resume)
                            .language(n.path("language").asText(""))
                            .proficiency(parseEnum(LanguageProficiencyEnum.class, n.path("proficiency").asText(null), LanguageProficiencyEnum.PROFESSIONAL))
                            .build());
                }
                resume.setLanguages(languages);
            }

            log.info("Successfully structured detailed resume ID: {}", resume.getId());
        } catch (Exception e) {
            log.error("Failed to parse detailed resume structure for resume ID: {}. Error: {}", resume.getId(), e.getMessage());
        }
    }

    private LocalDate parseLocalDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty() || dateStr.equalsIgnoreCase("null")) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr.trim());
        } catch (Exception e) {
            log.warn("Failed to parse date string: '{}', ignoring.", dateStr);
            return null;
        }
    }

    private BigDecimal parseBigDecimal(String numStr) {
        if (numStr == null || numStr.trim().isEmpty() || numStr.equalsIgnoreCase("null")) {
            return null;
        }
        try {
            return new BigDecimal(numStr.trim());
        } catch (Exception e) {
            log.warn("Failed to parse numeric string: '{}', ignoring.", numStr);
            return null;
        }
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumClass, String val, E defaultValue) {
        if (val == null || val.trim().isEmpty() || val.equalsIgnoreCase("null")) {
            return defaultValue;
        }
        try {
            return Enum.valueOf(enumClass, val.trim().toUpperCase());
        } catch (Exception e) {
            log.warn("Failed to map enum value '{}' for class '{}', returning default.", val, enumClass.getSimpleName());
            return defaultValue;
        }
    }

    @Transactional
    public void submitScanFeedback(Long scanId, Integer rating, String feedback, User user) {
        ResumeScan scan = resumeScanRepository.findById(scanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kết quả quét CV"));
        
        if (scan.getUser() != null && user != null && !scan.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện chức năng này");
        }

        scan.setUserRating(rating);
        scan.setUserFeedback(feedback);
        resumeScanRepository.save(scan);
        log.info("Saved scan feedback for scan ID: {}, rating: {}", scanId, rating);
    }

    @Transactional
    public void submitApplicationFeedback(Long applicationId, Integer rating, String feedback, User user) {
        CvScore score = cvScoreRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy điểm của hồ sơ ứng tuyển này"));

        if (score.getApplication().getResume().getUser() != null && user != null &&
            !score.getApplication().getResume().getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện chức năng này");
        }

        score.setUserRating(rating);
        score.setUserFeedback(feedback);
        cvScoreRepository.save(score);
        log.info("Saved application feedback for application ID: {}, rating: {}", applicationId, rating);
    }
}
