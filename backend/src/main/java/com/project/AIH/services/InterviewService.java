package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.dto.InterviewSubmitAnswerResponseDTO;
import com.project.AIH.dto.InterviewScoringMessage;
import com.project.AIH.dto.ReportGenerationMessage;
import com.project.AIH.models.*;
import com.project.AIH.repositories.*;
import com.project.AIH.utils.constant.InterviewDecisionEnum;
import com.project.AIH.utils.constant.InterviewSessionStatusEnum;
import com.project.AIH.utils.constant.DifficultyLevelEnum;
import com.project.AIH.utils.constant.InterviewTypeEnum;
import com.project.AIH.utils.constant.QuestionTypeEnum;
import com.project.AIH.utils.constant.CriteriaEnum;
import com.project.AIH.utils.constant.InterviewSessionTypeEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.project.AIH.dto.ResultPaginationDTO;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import com.project.AIH.utils.constant.InsightTypeEnum;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;

@Service
@Slf4j
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final InterviewAnswerRepository answerRepository;
    private final InterviewEvaluationRepository evaluationRepository;
    private final InterviewReportRepository reportRepository;
    private final ApplicationRepository applicationRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;
    
    // Injected Hybrid Repositories
    private final InterviewQuestionBankRepository questionBankRepository;
    private final AnswerScoreRepository answerScoreRepository;
    private final InterviewTemplateRepository templateRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeScanRepository resumeScanRepository;
    private final JobRepository jobRepository;
    private final InterviewScoringPublisher scoringPublisher;
    private final ReportGenerationPublisher reportGenerationPublisher;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixSchema() {
        try {
            log.info("Attempting to fix interview_sessions schema: allowing NULL application_id...");
            jdbcTemplate.execute("ALTER TABLE interview_sessions MODIFY application_id BIGINT NULL");
            log.info("Successfully fixed interview_sessions schema.");
        } catch (Exception e) {
            log.warn("Schema fix (ALTER TABLE) skipped or failed: {}. This is normal if the column is already NULL or if permissions are restricted.", e.getMessage());
        }
    }

    private DifficultyLevelEnum mapLevelToDifficulty(String level) {
        if (level == null) {
            return DifficultyLevelEnum.MEDIUM;
        }
        String l = level.toUpperCase();
        if (l.contains("INTERN") || l.contains("FRESHER") || l.contains("EASY")) {
            return DifficultyLevelEnum.EASY;
        } else if (l.contains("JUNIOR") || l.contains("MIDDLE") || l.contains("MEDIUM") || l.contains("MID")) {
            return DifficultyLevelEnum.MEDIUM;
        } else {
            return DifficultyLevelEnum.HARD;
        }
    }

    @Transactional(readOnly = true)
    public InterviewSession getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    @Transactional(readOnly = true)
    public ResultPaginationDTO getSessionsByUser(Specification<InterviewSession> spec, Pageable pageable, User user) {
        log.info("Fetching paginated interview sessions for user ID: {}", user.getId());

        // Secure boundary: Force filtering by current user (join through application and resume)
        Specification<InterviewSession> combinedSpec = (root, query, cb) -> cb.equal(root.get("application").get("resume").get("user").get("id"), user.getId());
        if (spec != null) {
            combinedSpec = combinedSpec.and(spec);
        }

        Page<InterviewSession> pageSession = sessionRepository.findAll(combinedSpec, pageable);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageSession.getNumber() + 1);
        meta.setPageSize(pageSession.getSize());
        meta.setPages(pageSession.getTotalPages());
        meta.setTotal(pageSession.getTotalElements());
        rs.setMeta(meta);
        rs.setResult(pageSession.getContent());

        return rs;
    }

    @Transactional(readOnly = true)
    public java.util.Optional<InterviewReport> getReportBySessionId(Long sessionId) {
        return reportRepository.findByInterviewSessionId(sessionId);
    }

    @Transactional
    public InterviewSession startMockSession(Long resumeId, String targetRole, String jobDescription, String targetLevel) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        return startMockSessionWithResume(resume, targetRole, jobDescription, targetLevel, null);
    }

    @Transactional
    public InterviewSession startMockSessionByScan(Long scanId, String targetRole, String jobDescription, String targetLevel) {
        ResumeScan scan = resumeScanRepository.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Resume scan not found"));
        Resume syntheticResume = Resume.builder()
                .extractedText(scan.getExtractedText())
                .fullName(scan.getCandidateName())
                .predictedIndustry(scan.getIndustry())
                .build();
        return startMockSessionWithResume(syntheticResume, targetRole, jobDescription, targetLevel, scanId);
    }

    private InterviewSession startMockSessionWithResume(Resume resume, String targetRole, String jobDescription, String targetLevel, Long sourceResumeScanId) {
        DifficultyLevelEnum difficulty = mapLevelToDifficulty(targetLevel);
        
        InterviewSession session = InterviewSession.builder()
                .sessionType(InterviewSessionTypeEnum.MOCK)
                .mockResume(resume.getId() != null ? resume : null)
                .sourceResumeScanId(sourceResumeScanId)
                .mockJobTitle(targetRole)
                .mockJdContent(jobDescription)
                .status(InterviewSessionStatusEnum.IN_PROGRESS)
                .interviewType(InterviewTypeEnum.MIXED)
                .difficultyLevel(difficulty)
                .totalQuestions(1)
                .maxQuestions(5)
                .build();
        session = sessionRepository.save(session);

        String industry = (resume.getBasicInfo() != null) ? resume.getBasicInfo().getPredictedIndustry() : "IT";
        if (industry == null || industry.isEmpty()) {
            industry = "IT";
        }

        setupQuestionsForSession(session, targetRole, jobDescription, resume, difficulty, null, industry);
        
        return session;
    }

    @Transactional
    public InterviewSession startSession(Long applicationId) {
        return startSession(applicationId, null);
    }

    @Transactional
    public InterviewSession startSession(Long applicationId, String targetLevel) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // Determine level of candidates: Target parameter, or fallback to predicted level in CV
        DifficultyLevelEnum difficulty = DifficultyLevelEnum.MEDIUM;
        if (targetLevel != null && !targetLevel.isEmpty()) {
            difficulty = mapLevelToDifficulty(targetLevel);
        } else if (application.getResume().getBasicInfo() != null && application.getResume().getBasicInfo().getPredictedLevel() != null) {
            difficulty = mapLevelToDifficulty(application.getResume().getBasicInfo().getPredictedLevel().name());
        }

        InterviewSession session = InterviewSession.builder()
                .application(application)
                .status(InterviewSessionStatusEnum.IN_PROGRESS)
                .interviewType(InterviewTypeEnum.MIXED)
                .difficultyLevel(difficulty)
                .totalQuestions(1)
                .maxQuestions(5)
                .build();
        session = sessionRepository.save(session);

        Job job = application.getJob();
        Resume resume = application.getResume();
        String targetRole = job.getTitle();
        String industry = (resume.getBasicInfo() != null) ? resume.getBasicInfo().getPredictedIndustry() : "IT";
        if (industry == null || industry.isEmpty()) {
            industry = "IT";
        }

        setupQuestionsForSession(session, targetRole, job.getDescription(), resume, difficulty, job.getId(), industry);

        return session;
    }

    private void setupQuestionsForSession(InterviewSession session, String targetRole, String jobDescription, 
                                        Resume resume, DifficultyLevelEnum difficulty, Long jobId, String industry) {
        List<InterviewQuestion> sessionQuestions = new ArrayList<>();
        
        // --- HYBRID FLOW: Random Questions from Pool (Only if jobId exists) ---
        List<InterviewQuestionBank> cachedPool = (jobId != null) ? 
                questionBankRepository.findByJobIdAndDifficulty(jobId, difficulty) : 
                new ArrayList<>();

        if (cachedPool.size() >= 3) {
            log.info("Found {} questions in cache pool for Job ID: {}, Level: {}. Selecting 3 random questions...", 
                    cachedPool.size(), jobId, difficulty);
            
            // Randomly select 3 questions from pool
            List<InterviewQuestionBank> selectedPool = new ArrayList<>(cachedPool);
            java.util.Collections.shuffle(selectedPool);
            List<InterviewQuestionBank> selectedQuestions = selectedPool.subList(0, 3);
            
            for (int i = 0; i < 3; i++) {
                InterviewQuestionBank bankQ = selectedQuestions.get(i);
                bankQ.setUseCount(bankQ.getUseCount() + 1);
                questionBankRepository.save(bankQ);
                
                sessionQuestions.add(InterviewQuestion.builder()
                        .interviewSession(session)
                        .questionText(bankQ.getQuestionText())
                        .questionType(bankQ.getQuestionType())
                        .difficulty(difficulty)
                        .questionOrder(i + 1)
                        .canReuse(true)
                        .build());
            }
            
            // Generate Q4, Q5
            try {
                String aiResponse = geminiService.generatePersonalizedQuestions(jobDescription, resume.getExtractedText(), targetRole, industry, difficulty.name(), 2);
                JsonNode questionsArray = objectMapper.readTree(aiResponse);
                if (questionsArray.isArray()) {
                    for (int i = 0; i < questionsArray.size(); i++) {
                        JsonNode qNode = questionsArray.get(i);
                        InterviewQuestion q = InterviewQuestion.builder()
                                .interviewSession(session)
                                .questionText(qNode.path("question").asText())
                                .questionType(QuestionTypeEnum.TECHNICAL)
                                .difficulty(difficulty)
                                .questionOrder(4 + i)
                                .cvContext(qNode.path("cv_context").asText())
                                .jdContext(qNode.path("jd_context").asText())
                                .canReuse(qNode.path("can_reuse").asBoolean(false))
                                .build();
                        sessionQuestions.add(q);

                        // Save reusable personalized questions to grow the pool! (Only if jobId exists)
                        if (jobId != null && q.getCanReuse() != null && q.getCanReuse()) {
                            Job job = jobRepository.findById(jobId).orElse(null);
                            if (job != null) {
                                InterviewQuestionBank bankQ = InterviewQuestionBank.builder()
                                        .job(job)
                                        .questionText(q.getQuestionText())
                                        .questionType(QuestionTypeEnum.TECHNICAL)
                                        .difficulty(difficulty)
                                        .topic(targetRole)
                                        .questionOrder(4 + i)
                                        .useCount(1)
                                        .build();
                                questionBankRepository.save(bankQ);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to generate personalized questions", e);
            }
        } else {
            log.info("Generating all 5 questions using Gemini...");
            try {
                String aiResponse = geminiService.generateAllQuestions(jobDescription, resume.getExtractedText(), targetRole, industry, difficulty.name());
                JsonNode questionsArray = objectMapper.readTree(aiResponse);
                if (questionsArray.isArray()) {
                    for (int i = 0; i < questionsArray.size(); i++) {
                        JsonNode qNode = questionsArray.get(i);
                        int order = i + 1;
                        boolean isReusable = qNode.path("can_reuse").asBoolean(true);
                        
                        InterviewQuestion q = InterviewQuestion.builder()
                                .interviewSession(session)
                                .questionText(qNode.path("question").asText())
                                .questionType(QuestionTypeEnum.TECHNICAL)
                                .difficulty(difficulty)
                                .questionOrder(order)
                                .cvContext(qNode.path("cv_context").asText())
                                .jdContext(qNode.path("jd_context").asText())
                                .canReuse(isReusable)
                                .build();
                        sessionQuestions.add(q);

                        // Cache/save generated questions to populate the pool (Only if jobId exists)
                        if (jobId != null && isReusable) {
                            Job job = jobRepository.findById(jobId).orElse(null);
                            if (job != null) {
                                InterviewQuestionBank bankQ = InterviewQuestionBank.builder()
                                        .job(job)
                                        .questionText(q.getQuestionText())
                                        .questionType(QuestionTypeEnum.TECHNICAL)
                                        .difficulty(difficulty)
                                        .topic(targetRole)
                                        .questionOrder(order)
                                        .useCount(1)
                                        .build();
                                questionBankRepository.save(bankQ);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to generate questions via Gemini", e);
            }
        }

        // Fallback for missing questions
        String[] fallbacks = {
            "Hãy giới thiệu bản thân và tóm tắt những dự án nổi bật nhất mà bạn từng thực hiện.",
            "Bạn xử lý thế nào khi gặp một vấn đề kỹ thuật khó khăn mà không tìm được giải pháp trên mạng?",
            "Hãy chia sẻ về một lần bạn làm việc nhóm và có bất đồng quan điểm. Bạn đã giải quyết như thế nào?",
            "Điều gì là thành tựu tự hào nhất của bạn trong công việc/học tập từ trước đến nay?",
            "Bạn mong muốn đạt được điều gì trong 2-3 năm tới trên con đường sự nghiệp của mình?"
        };
        
        for (int i = sessionQuestions.size(); i < 5; i++) {
            sessionQuestions.add(InterviewQuestion.builder()
                    .interviewSession(session)
                    .questionText(fallbacks[i])
                    .questionType(QuestionTypeEnum.TECHNICAL)
                    .difficulty(difficulty)
                    .questionOrder(i + 1)
                    .canReuse(false)
                    .build());
        }

        // Save all questions
        for (InterviewQuestion q : sessionQuestions) {
            questionRepository.save(q);
        }
        
        session.setTotalQuestions(5);
        session.setMaxQuestions(5);
        sessionRepository.save(session);
    }

    @Transactional
    public InterviewSubmitAnswerResponseDTO submitAnswer(Long sessionId, String answerText, String idempotencyKey) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != InterviewSessionStatusEnum.IN_PROGRESS) {
            throw new RuntimeException("Interview session is already finished");
        }

        // Check if idempotency key is already used
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            java.util.Optional<InterviewAnswer> existingAnswer = answerRepository.findByIdempotencyKey(idempotencyKey);
            if (existingAnswer.isPresent()) {
                InterviewAnswer ans = existingAnswer.get();
                log.info("Duplicate submit detected via idempotency key: {}. Returning cached response.", idempotencyKey);
                
                InterviewQuestion nextQ = null;
                int currentOrder = ans.getInterviewQuestion().getQuestionOrder();
                boolean isFinished = currentOrder >= session.getMaxQuestions();
                
                if (!isFinished) {
                    List<InterviewQuestion> allQuestions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
                    for (InterviewQuestion q : allQuestions) {
                        if (q.getQuestionOrder() == currentOrder + 1) {
                            nextQ = q;
                            break;
                        }
                    }
                }
                
                return InterviewSubmitAnswerResponseDTO.builder()
                        .evaluation(null)
                        .nextQuestion(nextQ)
                        .isFinished(isFinished)
                        .scoreStatus("pending")
                        .build();
            }
        }

        // Find current active question
        List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        if (questions.isEmpty()) {
            throw new RuntimeException("No question found for this session");
        }
        
        // The current question is the first unanswered one
        InterviewQuestion currentQuestion = null;
        for (InterviewQuestion q : questions) {
            if (q.getInterviewAnswer() == null) {
                currentQuestion = q;
                break;
            }
        }
        
        if (currentQuestion == null) {
            throw new RuntimeException("All questions have been answered");
        }

        // Save candidate answer
        InterviewAnswer answer = InterviewAnswer.builder()
                .interviewQuestion(currentQuestion)
                .answerText(answerText)
                .idempotencyKey(idempotencyKey)
                .build();
        
        try {
            answer = answerRepository.saveAndFlush(answer);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn("Database unique constraint violation on idempotency key: {}. Trying to recover.", idempotencyKey);
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                java.util.Optional<InterviewAnswer> dup = answerRepository.findByIdempotencyKey(idempotencyKey);
                if (dup.isPresent()) {
                    InterviewAnswer ans = dup.get();
                    InterviewQuestion nextQ = null;
                    int currentOrder = ans.getInterviewQuestion().getQuestionOrder();
                    boolean isFinished = currentOrder >= session.getMaxQuestions();
                    
                    if (!isFinished) {
                        List<InterviewQuestion> allQuestions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
                        for (InterviewQuestion q : allQuestions) {
                            if (q.getQuestionOrder() == currentOrder + 1) {
                                nextQ = q;
                                break;
                            }
                        }
                    }
                    
                    return InterviewSubmitAnswerResponseDTO.builder()
                            .evaluation(null)
                            .nextQuestion(nextQ)
                            .isFinished(isFinished)
                            .scoreStatus("pending")
                            .build();
                }
            }
            throw ex;
        }

        int currentOrder = currentQuestion.getQuestionOrder();
        boolean isFinished = currentOrder >= session.getMaxQuestions();

        String targetRole = session.getJobTitle();
        String industry = "IT";

        if (session.getSessionType() == InterviewSessionTypeEnum.MOCK) {
            if (session.getMockResume() != null && session.getMockResume().getBasicInfo() != null) {
                industry = session.getMockResume().getBasicInfo().getPredictedIndustry();
            }
        } else if (session.getApplication() != null && session.getApplication().getResume() != null) {
            Resume resume = session.getApplication().getResume();
            if (resume.getBasicInfo() != null) {
                industry = resume.getBasicInfo().getPredictedIndustry();
            }
        }

        if (industry == null || industry.isEmpty()) {
            industry = "IT";
        }
        String level = session.getDifficultyLevel().name();

        // Send to RabbitMQ for async scoring
        InterviewScoringMessage scoringMessage = InterviewScoringMessage.builder()
                .answerId(answer.getId())
                .sessionId(sessionId)
                .questionText(currentQuestion.getQuestionText())
                .answerText(answerText)
                .targetRole(targetRole)
                .industry(industry)
                .level(level)
                .build();
        scoringPublisher.publishScoringJob(scoringMessage);

        InterviewQuestion nextQuestion = null;
        if (!isFinished) {
            int nextOrder = currentOrder + 1;
            for (InterviewQuestion q : questions) {
                if (q.getQuestionOrder() == nextOrder) {
                    nextQuestion = q;
                    break;
                }
            }
        }


        return InterviewSubmitAnswerResponseDTO.builder()
                .evaluation(null) // Evaluation is async now
                .nextQuestion(nextQuestion)
                .isFinished(isFinished)
                .scoreStatus("pending")
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getScoreStatuses(Long sessionId) {
        List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        List<Map<String, Object>> scores = questions.stream().map(q -> {
            Map<String, Object> scoreInfo = new HashMap<>();
            scoreInfo.put("questionId", q.getId());
            scoreInfo.put("questionOrder", q.getQuestionOrder());
            
            if (q.getInterviewAnswer() != null && q.getInterviewAnswer().getInterviewEvaluation() != null) {
                scoreInfo.put("status", "completed");
                scoreInfo.put("score", q.getInterviewAnswer().getInterviewEvaluation().getScore());
                scoreInfo.put("feedback", q.getInterviewAnswer().getInterviewEvaluation().getFeedback());
            } else if (q.getInterviewAnswer() != null) {
                scoreInfo.put("status", "pending");
            } else {
                scoreInfo.put("status", "unanswered");
            }
            return scoreInfo;
        }).collect(Collectors.toList());
        
        return Map.of("scores", scores);
    }

    private void saveCriteriaScores(InterviewAnswer answer, JsonNode scoresNode) {
        if (scoresNode != null && scoresNode.isObject()) {
            for (CriteriaEnum criteria : CriteriaEnum.values()) {
                // Try uppercase first, then fallback to lowercase for robust LLM parsing
                JsonNode cNode = scoresNode.path(criteria.name());
                if (cNode.isMissingNode() || cNode.isNull()) {
                    cNode = scoresNode.path(criteria.name().toLowerCase());
                }

                if (!cNode.isMissingNode() && !cNode.isNull()) {
                    int cScore = cNode.path("score").asInt(5);
                    String cComment = cNode.path("comment").asText("");

                    AnswerScore answerScore = AnswerScore.builder()
                            .interviewAnswer(answer)
                            .criteria(criteria)
                            .score(cScore)
                            .comment(cComment)
                            .build();
                    answerScoreRepository.save(answerScore);
                }
            }
        }
    }

    @Transactional
    public InterviewSession finishSession(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        // Simply return session. Background worker is handling report generation.
        log.info("finishSession called for session {}. Returning immediately for async processing.", sessionId);
        return session;
    }

    @Transactional
    public InterviewSession generateReportSynchronously(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() == InterviewSessionStatusEnum.COMPLETED || 
            session.getStatus() == InterviewSessionStatusEnum.REPORT_GENERATING) {
            log.info("Report for session {} is already COMPLETED or GENERATING. Skipping.", sessionId);
            return session;
        }

        // Set status to REPORT_GENERATING to prevent race conditions
        session.setStatus(InterviewSessionStatusEnum.REPORT_GENERATING);
        session = sessionRepository.saveAndFlush(session);

        try {
            List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
            String chatHistory = getChatHistoryForReport(questions);
            String jobDesc = session.getJobDescription();

            log.info("Calling Gemini for final report generation (Session: {})", sessionId);
            String aiResponse = geminiService.generateFinalReport(jobDesc, chatHistory);

            JsonNode resultNode = objectMapper.readTree(aiResponse);
            double finalScoreDouble = resultNode.path("final_score").asDouble();
            String decisionStr = resultNode.path("decision").asText("CONSIDER");
            String summary = resultNode.path("summary").asText();
            
            InterviewDecisionEnum decision = InterviewDecisionEnum.CONSIDER;
            try {
                decision = InterviewDecisionEnum.valueOf(decisionStr);
            } catch (Exception ex) {
                log.warn("Invalid decision string: {}, default to CONSIDER", decisionStr);
            }

            // Create and save final report
            InterviewReport report = InterviewReport.builder()
                    .interviewSession(session)
                    .finalScore(BigDecimal.valueOf(finalScoreDouble))
                    .decision(decision)
                    .summary(summary)
                    .build();

            List<InterviewInsight> insightsList = new ArrayList<>();

            // Parse strengths
            JsonNode strengthsNode = resultNode.path("strengths");
            if (strengthsNode.isArray()) {
                int index = 0;
                for (JsonNode node : strengthsNode) {
                    insightsList.add(InterviewInsight.builder()
                            .interviewReport(report)
                            .type(InsightTypeEnum.STRENGTH)
                            .title(node.asText())
                            .displayOrder(index++)
                            .build());
                }
            }

            // Parse weaknesses
            JsonNode weaknessesNode = resultNode.path("weaknesses");
            if (weaknessesNode.isArray()) {
                int index = 0;
                for (JsonNode node : weaknessesNode) {
                    insightsList.add(InterviewInsight.builder()
                            .interviewReport(report)
                            .type(InsightTypeEnum.WEAKNESS)
                            .title(node.asText())
                            .displayOrder(index++)
                            .build());
                }
            }

            report.setInsights(insightsList);
            reportRepository.save(report);

            session.setStatus(InterviewSessionStatusEnum.COMPLETED);
            session.setEndTime(Instant.now());
            
            return sessionRepository.save(session);
        } catch (Exception e) {
            log.error("Failed to generate or parse Gemini final report: {}", e.getMessage());
            // Reset status so it can be retried
            session.setStatus(InterviewSessionStatusEnum.IN_PROGRESS);
            sessionRepository.save(session);
            throw new RuntimeException("Error generating final report: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<InterviewQuestion> getSessionQuestions(Long sessionId) {
        log.debug("Fetching questions for interview session ID: {}", sessionId);
        return questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public List<InterviewQuestion> getVisibleQuestions(Long sessionId) {
        log.debug("Fetching visible questions for interview session ID: {}", sessionId);
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        List<InterviewQuestion> allQuestions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        
        if (session.getStatus() == InterviewSessionStatusEnum.COMPLETED) {
            return allQuestions;
        }
        
        List<InterviewQuestion> visibleQuestions = new ArrayList<>();
        for (InterviewQuestion q : allQuestions) {
            visibleQuestions.add(q);
            if (q.getInterviewAnswer() == null) {
                break;
            }
        }
        return visibleQuestions;
    }

    private String getChatHistory(List<InterviewQuestion> questions, String latestAnswer) {
        StringBuilder sb = new StringBuilder();
        for (InterviewQuestion q : questions) {
            sb.append("AI: ").append(q.getQuestionText()).append("\n");
            if (q.getInterviewAnswer() != null) {
                sb.append("CANDIDATE: ").append(q.getInterviewAnswer().getAnswerText()).append("\n");
            }
        }
        if (!questions.isEmpty() && questions.get(questions.size() - 1).getInterviewAnswer() == null) {
            sb.append("CANDIDATE: ").append(latestAnswer).append("\n");
        }
        return sb.toString();
    }

    private String getChatHistoryForReport(List<InterviewQuestion> questions) {
        StringBuilder sb = new StringBuilder();
        for (InterviewQuestion q : questions) {
            sb.append("AI: ").append(q.getQuestionText()).append("\n");
            if (q.getInterviewAnswer() != null) {
                sb.append("CANDIDATE: ").append(q.getInterviewAnswer().getAnswerText()).append("\n");
            }
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public long getPendingEvaluationsCount(Long sessionId) {
        return answerRepository.countPendingEvaluationsNative(sessionId);
    }

    @Transactional(readOnly = true)
    public long getAnsweredCount(Long sessionId) {
        return answerRepository.countTotalAnswersNative(sessionId);
    }
}
