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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    @Transactional
    public Application applyAndScore(MultipartFile file, Long jobId, User user) {
        log.info("Starting CV application and scoring for user: {} and job: {}", user.getEmail(), jobId);

        // 1. Upload CV to MinIO
        String fileName = fileService.uploadFile(file, "resumes/" + user.getId());

        // 2. Extract Text from CV
        String extractedText = "";
        try {
            extractedText = parserService.extractText(file.getInputStream());
        } catch (Exception e) {
            log.error("Failed to extract text: {}", e.getMessage());
        }

        // 3. Save Resume record
        Resume resume = Resume.builder()
                .user(user)
                .fileUrl(fileName)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .parseStatus(ResumeStatusEnum.PROCESSING)
                .build();
        parseAndPopulateDetailedResume(resume, extractedText);
        resume = resumeRepository.save(resume);

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

    @Transactional
    public Resume uploadAndParse(MultipartFile file, User user) {
        String userEmail = (user != null) ? user.getEmail() : "anonymous";
        String folderPath = (user != null) ? "resumes/" + user.getId() : "resumes/guest";
        log.info("Uploading and parsing resume for user: {}", userEmail);

        // Calculate file hash FIRST to check for cached results
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            fileBytes = new byte[0];
        }
        String fileHash = calculateFileHash(fileBytes);

        // Check if we have an existing scan for this hash
        java.util.Optional<ResumeScan> existingScan = resumeScanRepository.findByFileHash(fileHash);
        if (existingScan.isPresent()) {
            ResumeScan scan = existingScan.get();
            log.info("Found cached ResumeScan for file hash: {}. Reconstructing JSON...", fileHash);
            
            // Check if there's an existing Resume with this same file name/url
            java.util.Optional<Resume> existingResume = resumeRepository.findByFileUrl(scan.getFileName());
            if (existingResume.isPresent()) {
                Resume cachedResume = existingResume.get();
                
                boolean isSameUser = false;
                if (user == null && cachedResume.getUser() == null) {
                    isSameUser = true;
                } else if (user != null && cachedResume.getUser() != null && user.getId().equals(cachedResume.getUser().getId())) {
                    isSameUser = true;
                }
                
                if (isSameUser) {
                    log.info("Returning existing cached Resume (ID: {}) for the same user.", cachedResume.getId());
                    return cachedResume;
                }
                
                // If it belongs to a different user, create a new Resume record for the current user,
                // but populate all parsed details from the cached resume (takes ~0ms and avoids Gemini)
                log.info("Copying parsed CV data from cache for different user.");
                Resume newResume = Resume.builder()
                        .user(user)
                        .fileUrl(scan.getFileName()) // Reuse the existing file Url
                        .contentType(file.getContentType())
                        .fileSize(file.getSize())
                        .extractedText(cachedResume.getExtractedText())
                        .parsedData(cachedResume.getParsedData())
                        .parseStatus(cachedResume.getParseStatus())
                        .build();
                
                // Copy detailed fields to save database queries/calls
                parseAndPopulateDetailedResume(newResume, cachedResume.getExtractedText());
                newResume = resumeRepository.save(newResume);
                
                // Also create a ResumeScan link for this new user so they can find their scan result in their scan list
                try {
                    scanMapperService.saveScanResult(user, scan.getFileName(), fileHash, cachedResume.getParsedData());
                } catch (Exception e) {
                    log.error("Failed to copy scan result for new user: {}", e.getMessage());
                }
                
                return newResume;
            }
        }

        // 1. Upload CV to MinIO (Cache Miss path)
        String fileName = fileService.uploadFile(file, folderPath);

        // 2. Extract Text
        String extractedText = "";
        try {
            extractedText = parserService.extractText(file.getInputStream());
        } catch (Exception e) {
            log.error("Failed to extract text: {}", e.getMessage());
        }

        // 3. AI Analysis (General - Hybrid Strategy)
        String parsedData = "";
        try {
            if (isTextCorrupted(extractedText)) {
                log.info("Extracted text is empty or corrupted. Falling back to Gemini Vision using file bytes.");
                parsedData = geminiService.parseResume(fileBytes, file.getContentType());
            } else {
                log.info("Extracted text is of high quality. Calling Gemini with text thô for high speed and token optimization.");
                parsedData = geminiService.parseResumeText(extractedText);
            }
            parsedData = scanMapperService.enrichAndCalculateGaps(parsedData);
        } catch (Exception e) {
            log.error("AI Analysis failed: {}", e.getMessage());
        }

        // 4. Save Resume record
        Resume resume = Resume.builder()
                .user(user)
                .fileUrl(fileName)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .parsedData(parsedData)
                .parseStatus(parsedData.isEmpty() ? ResumeStatusEnum.FAILED : ResumeStatusEnum.DONE)
                .build();
        parseAndPopulateDetailedResume(resume, extractedText);
        resume = resumeRepository.save(resume);

        // 5. Structure and Save in the normalized database schema
        if (!parsedData.isEmpty()) {
            try {
                scanMapperService.saveScanResult(user, fileName, fileHash, parsedData);
            } catch (Exception e) {
                log.error("Failed to save scan results in structured tables: {}", e.getMessage());
            }
        }

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
    public List<Resume> getResumesByUser(User user) {
        log.info("Fetching resumes for user ID: {}", user.getId());
        return resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
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
            JsonNode root = objectMapper.readTree(responseJson);

            // 1. Basic Info
            JsonNode basicNode = root.path("basicInfo");
            if (!basicNode.isMissingNode() && !basicNode.isNull()) {
                ResumeBasicInfo basicInfo = ResumeBasicInfo.builder()
                        .resume(resume)
                        .fullName(basicNode.path("fullName").asText(null))
                        .email(basicNode.path("email").asText(null))
                        .phone(basicNode.path("phone").asText(null))
                        .address(basicNode.path("address").asText(null))
                        .dateOfBirth(parseLocalDate(basicNode.path("dateOfBirth").asText(null)))
                        .linkedinUrl(basicNode.path("linkedinUrl").asText(null))
                        .githubUrl(basicNode.path("githubUrl").asText(null))
                        .portfolioUrl(basicNode.path("portfolioUrl").asText(null))
                        .objective(basicNode.path("objective").asText(null))
                        .predictedLevel(parseEnum(CandidateLevelEnum.class, basicNode.path("predictedLevel").asText(null), null))
                        .predictedIndustry(basicNode.path("predictedIndustry").asText(null))
                        .build();
                resume.setBasicInfo(basicInfo);
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
                    projects.add(ResumeProject.builder()
                            .resume(resume)
                            .name(n.path("name").asText(""))
                            .role(n.path("role").asText(""))
                            .technologies(n.path("technologies").asText(""))
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
}
