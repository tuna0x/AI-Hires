package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.models.*;
import com.project.AIH.repositories.*;
import com.project.AIH.utils.constant.ApplicationStatusEnum;
import com.project.AIH.utils.constant.ResumeStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

        // 5. AI Scoring (Hybrid: Text for Search, Bytes for AI Precision)
        try {
            String aiResponseRaw = geminiService.analyzeResume(file.getBytes(), file.getContentType(), job.getDescription());
            
            // Extract the actual JSON string from Gemini response
            JsonNode root = objectMapper.readTree(aiResponseRaw);
            String aiResultText = root.path("candidates").get(0)
                                      .path("content").path("parts").get(0)
                                      .path("text").asText();
            
            // Clean markdown artifacts if present
            aiResultText = aiResultText.replace("```json", "").replace("```", "").trim();
            JsonNode resultNode = objectMapper.readTree(aiResultText);

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
        } catch (Exception e) {
            log.error("AI Scoring failed: {}", e.getMessage());
            resume.setParseStatus(ResumeStatusEnum.FAILED);
        }

        resumeRepository.save(resume);
        return application;
    }
}
