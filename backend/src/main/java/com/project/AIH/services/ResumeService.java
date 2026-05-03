package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.models.*;
import com.project.AIH.repositories.*;
import com.project.AIH.utils.constant.ApplicationStatusEnum;
import com.project.AIH.utils.constant.ResumeStatusEnum;
import com.project.AIH.dto.CvScoringMessage;
import com.project.AIH.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResumeService {

    private final FileService fileService;
    private final ResumeParserService parserService;
    private final GeminiService geminiService;
    
    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final AiScoreRepository aiScoreRepository;
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
        log.info("Uploading and parsing resume for user: {}", user.getEmail());

        // 1. Upload CV to MinIO
        String fileName = fileService.uploadFile(file, "resumes/" + user.getId());

        // 2. Extract Text
        String extractedText = "";
        try {
            extractedText = parserService.extractText(file.getInputStream());
        } catch (Exception e) {
            log.error("Failed to extract text: {}", e.getMessage());
        }

        // 3. AI Analysis (General)
        String parsedData = "";
        try {
            parsedData = geminiService.parseResume(file.getBytes(), file.getContentType());
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
        
        return resumeRepository.save(resume);
    }
}
