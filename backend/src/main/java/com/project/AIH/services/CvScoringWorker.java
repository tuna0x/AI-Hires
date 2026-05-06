package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.CvScoringMessage;
import com.project.AIH.models.CvScore;
import com.project.AIH.models.CvScoreInsight;
import com.project.AIH.models.Application;
import com.project.AIH.models.Job;
import com.project.AIH.models.Resume;
import com.project.AIH.repositories.CvScoreRepository;
import com.project.AIH.repositories.ApplicationRepository;
import com.project.AIH.repositories.JobRepository;
import com.project.AIH.repositories.ResumeRepository;
import com.project.AIH.utils.constant.ApplicationStatusEnum;
import com.project.AIH.utils.constant.ResumeStatusEnum;
import com.project.AIH.utils.constant.InsightTypeEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CvScoringWorker {

    private final GeminiService geminiService;
    private final FileService fileService;
    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;
    private final CvScoreRepository cvScoreRepository;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.CV_SCORING_QUEUE)
    @Transactional
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
            double stage2Score = resultNode.path("stage2_core").path("score").asDouble(0.0);
            double stage3Score = resultNode.path("stage3_in_depth").path("score").asDouble(0.0);
            double stage4Score = resultNode.path("stage4_bonus").path("score").asDouble(0.0);

            CvScore cvScore = CvScore.builder()
                    .application(application)
                    .totalScore(BigDecimal.valueOf(resultNode.path("total_score").asDouble()))
                    .stage2Score(BigDecimal.valueOf(stage2Score))
                    .stage3Score(BigDecimal.valueOf(stage3Score))
                    .stage4Score(BigDecimal.valueOf(stage4Score))
                    .rawAiResponse(aiResultText)
                    .build();

            List<CvScoreInsight> insightsList = new ArrayList<>();

            // Parse strengths
            JsonNode strengthsNode = resultNode.path("strengths");
            if (strengthsNode.isArray()) {
                int index = 0;
                for (JsonNode node : strengthsNode) {
                    insightsList.add(CvScoreInsight.builder()
                            .cvScore(cvScore)
                            .type(InsightTypeEnum.STRENGTH)
                            .title(node.asText())
                            .displayOrder(index++)
                            .build());
                }
            }

            // Parse priority_actions
            JsonNode actionsNode = resultNode.path("priority_actions");
            if (actionsNode.isArray()) {
                int index = 0;
                for (JsonNode node : actionsNode) {
                    insightsList.add(CvScoreInsight.builder()
                            .cvScore(cvScore)
                            .type(InsightTypeEnum.ACTION)
                            .title(node.path("action").asText())
                            .description(node.path("priority").asText())
                            .priority(node.path("priority").asText().equalsIgnoreCase("Cao") ? 1 : 2)
                            .displayOrder(index++)
                            .build());
                }
            }

            cvScore.setInsights(insightsList);
            cvScoreRepository.save(cvScore);

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
