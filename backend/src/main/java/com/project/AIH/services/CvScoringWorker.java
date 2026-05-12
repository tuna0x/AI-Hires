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
import com.project.AIH.models.ResumeRawAiOutput;
import com.project.AIH.repositories.CvScoreRepository;
import com.project.AIH.repositories.ApplicationRepository;
import com.project.AIH.repositories.JobRepository;
import com.project.AIH.repositories.ResumeRepository;
import com.project.AIH.repositories.ResumeRawAiOutputRepository;
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
    private final ScanMapperService scanMapperService;
    private final ResumeRawAiOutputRepository rawAiOutputRepository;
    private final ScoringResultValidator scoringResultValidator;

    @RabbitListener(queues = RabbitMQConfig.CV_SCORING_QUEUE)
    @Transactional
    public void processCvScoring(org.springframework.amqp.core.Message amqpMessage) {
        log.info("Received CV Scoring message via AMQP Message");

        try {
            String messageJson = new String(amqpMessage.getBody());
            CvScoringMessage message = objectMapper.readValue(messageJson, CvScoringMessage.class);
            log.info("Processing CV scoring for application ID: {}", message.getApplicationId());

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
            String aiResponseRaw = geminiService.analyzeResume(fileBytes, message.getContentType(), job.getDescription(), job.getLevel());

            // 3. Parse JSON
            JsonNode root = objectMapper.readTree(aiResponseRaw);
            String aiResultText = root.path("candidates").get(0)
                                      .path("content").path("parts").get(0)
                                      .path("text").asText();
            
            String cleaned = aiResultText.replace("```json", "").replace("```", "").trim();
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{[\\s\\S]*\\}");
            java.util.regex.Matcher matcher = pattern.matcher(cleaned);
            if (matcher.find()) {
                aiResultText = matcher.group();
            } else {
                aiResultText = cleaned;
            }
            aiResultText = scanMapperService.enrichAndCalculateGaps(aiResultText);
            JsonNode resultNode = objectMapper.readTree(aiResultText);

            // Validate and normalize Gemini JSON output before persisting
            resultNode = scoringResultValidator.validateAndNormalize(resultNode);
            aiResultText = objectMapper.writeValueAsString(resultNode);

            // 4. Save Score
            double stage2Score = resultNode.path("stage2_core").path("score").asDouble(0.0);
            double stage3Score = resultNode.path("stage3_in_depth").path("score").asDouble(0.0);
            double stage4Score = resultNode.path("stage4_bonus").path("score").asDouble(0.0);

            CvScore cvScore = CvScore.builder()
                    .application(application)
                    .totalScore(BigDecimal.valueOf(resultNode.path("total_score").asDouble(0.0)))
                    .stage2Score(BigDecimal.valueOf(stage2Score))
                    .stage3Score(BigDecimal.valueOf(stage3Score))
                    .stage4Score(BigDecimal.valueOf(stage4Score))
                    .rawAiResponse(aiResultText)
                    .scoringVersion("v1.1") // Set current scoring version
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

            ResumeRawAiOutput rawOutput = ResumeRawAiOutput.builder()
                    .resume(resume)
                    .atsJson(aiResultText)
                    .profileJson("")
                    .aiModel("gemini-3.1-flash-lite")
                    .promptVersion("v1.0")
                    .build();
            rawAiOutputRepository.save(rawOutput);
            resume.setRawAiOutput(rawOutput);
            resume.setParseStatus(ResumeStatusEnum.DONE);
            resumeRepository.save(resume);

            // Structure and Save in the normalized database schema
            try {
                String fileHash = "";
                try {
                    java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                    byte[] hashBytes = digest.digest(fileBytes);
                    StringBuilder hexString = new StringBuilder();
                    for (byte b : hashBytes) {
                        String hex = Integer.toHexString(0xff & b);
                        if (hex.length() == 1) hexString.append('0');
                        hexString.append(hex);
                    }
                    fileHash = hexString.toString();
                } catch (Exception e) {
                    fileHash = java.util.UUID.randomUUID().toString();
                }
                scanMapperService.saveScanResult(resume.getUser(), message.getFileUrl(), fileHash, aiResultText);
            } catch (Exception e) {
                log.error("Failed to save scan results in structured tables: {}", e.getMessage());
            }

            application.setStatus(ApplicationStatusEnum.INTERVIEWING); // Example status after screening
            applicationRepository.save(application);

            log.info("Successfully scored and updated application: {}", application.getId());

        } catch (Exception e) {
            log.error("Failed to process CV scoring. Error: {}", e.getMessage());
            // Fail safely if possible
        }
    }
}
