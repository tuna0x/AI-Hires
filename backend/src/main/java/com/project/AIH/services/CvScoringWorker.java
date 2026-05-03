package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.CvScoringMessage;
import com.project.AIH.models.AiScore;
import com.project.AIH.models.Application;
import com.project.AIH.models.Job;
import com.project.AIH.models.Resume;
import com.project.AIH.repositories.AiScoreRepository;
import com.project.AIH.repositories.ApplicationRepository;
import com.project.AIH.repositories.JobRepository;
import com.project.AIH.repositories.ResumeRepository;
import com.project.AIH.utils.constant.ApplicationStatusEnum;
import com.project.AIH.utils.constant.ResumeStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@Slf4j
@RequiredArgsConstructor
public class CvScoringWorker {

    private final GeminiService geminiService;
    private final FileService fileService;
    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;
    private final AiScoreRepository aiScoreRepository;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.CV_SCORING_QUEUE)
    public void processCvScoring(CvScoringMessage message) {
        log.info("Received CV Scoring message for application: {}", message.getApplicationId());

        try {
            Application application = applicationRepository.findById(message.getApplicationId())
                    .orElseThrow(() -> new RuntimeException("Application not found: " + message.getApplicationId()));
            Resume resume = resumeRepository.findById(message.getResumeId())
                    .orElseThrow(() -> new RuntimeException("Resume not found: " + message.getResumeId()));
            Job job = jobRepository.findById(message.getJobId())
                    .orElseThrow(() -> new RuntimeException("Job not found: " + message.getJobId()));

            // 1. Download file bytes from MinIO
            InputStream is = fileService.getFileStream(message.getFileUrl());
            byte[] fileBytes = is.readAllBytes();
            is.close();

            // 2. Call Gemini
            String aiResponseRaw = geminiService.analyzeResume(fileBytes, message.getContentType(), job.getDescription());

            // 3. Parse JSON
            JsonNode root = objectMapper.readTree(aiResponseRaw);
            String aiResultText = root.path("candidates").get(0)
                                      .path("content").path("parts").get(0)
                                      .path("text").asText();
            
            aiResultText = aiResultText.replace("```json", "").replace("```", "").trim();
            JsonNode resultNode = objectMapper.readTree(aiResultText);

            // 4. Save Score
            AiScore aiScore = AiScore.builder()
                    .application(application)
                    .totalScore(resultNode.path("total_score").asDouble())
                    .scoreBreakdown(resultNode.path("stage2_core").toString())
                    .aiReasoning(resultNode.path("strengths").toString())
                    .aiSuggestions(resultNode.path("priority_actions").toString())
                    .detailedResult(aiResultText)
                    .build();
            aiScoreRepository.save(aiScore);

            resume.setParsedData(aiResultText);
            resume.setParseStatus(ResumeStatusEnum.DONE);
            resumeRepository.save(resume);

            application.setStatus(ApplicationStatusEnum.INTERVIEWING); // Example status after screening
            applicationRepository.save(application);

            log.info("Successfully scored and updated application: {}", application.getId());

        } catch (Exception e) {
            log.error("Failed to process CV scoring for message: {}. Error: {}", message, e.getMessage());
            // Optionally set resume status to FAILED here
            try {
                Resume resume = resumeRepository.findById(message.getResumeId()).orElse(null);
                if (resume != null) {
                    resume.setParseStatus(ResumeStatusEnum.FAILED);
                    resumeRepository.save(resume);
                }
            } catch (Exception innerE) {
                log.error("Could not update resume status to FAILED: {}", innerE.getMessage());
            }
        }
    }
}
