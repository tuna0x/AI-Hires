package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.dto.InterviewSubmitAnswerResponseDTO;
import com.project.AIH.models.*;
import com.project.AIH.repositories.*;
import com.project.AIH.utils.constant.InterviewDecisionEnum;
import com.project.AIH.utils.constant.InterviewSessionStatusEnum;
import com.project.AIH.utils.constant.DifficultyLevelEnum;
import com.project.AIH.utils.constant.InterviewTypeEnum;
import com.project.AIH.utils.constant.QuestionTypeEnum;
import com.project.AIH.utils.constant.CriteriaEnum;
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
import java.math.BigDecimal;
import com.project.AIH.utils.constant.InsightTypeEnum;

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
    private final JobRepository jobRepository;

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

        // 1. Create a dummy Job representing the practice/mock target
        Job mockJob = Job.builder()
                .title(targetRole)
                .description(jobDescription)
                .requirements(jobDescription)
                .location("Online")
                .salary(0.0)
                .quantity(1)
                .active(false) // mock
                .build();
        mockJob = jobRepository.save(mockJob);

        // 2. Create a dummy Application connecting resume and job
        Application mockApp = Application.builder()
                .job(mockJob)
                .resume(resume)
                .build();
        mockApp = applicationRepository.save(mockApp);

        // 3. Delegate to start standard session
        return startSession(mockApp.getId(), targetLevel);
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

        // --- HYBRID FLOW: Questions 1, 2, 3 lookup and cache ---
        String initialQuestionText = null;
        String cvContext = null;
        String jdContext = null;
        Boolean canReuse = false;

        // Check if all Questions 1, 2, 3 exist in bank for this job and difficulty
        java.util.Optional<InterviewQuestionBank> cachedQ1 = questionBankRepository
                .findByJobIdAndDifficultyAndQuestionOrder(job.getId(), difficulty, 1);
        java.util.Optional<InterviewQuestionBank> cachedQ2 = questionBankRepository
                .findByJobIdAndDifficultyAndQuestionOrder(job.getId(), difficulty, 2);
        java.util.Optional<InterviewQuestionBank> cachedQ3 = questionBankRepository
                .findByJobIdAndDifficultyAndQuestionOrder(job.getId(), difficulty, 3);

        if (cachedQ1.isPresent() && cachedQ2.isPresent() && cachedQ3.isPresent()) {
            log.info("All questions Q1, Q2, Q3 found in cache for Job ID: {}, Level: {}", job.getId(), difficulty);
            InterviewQuestionBank bankQ1 = cachedQ1.get();
            initialQuestionText = bankQ1.getQuestionText();
            bankQ1.setUseCount(bankQ1.getUseCount() + 1);
            questionBankRepository.save(bankQ1);
            
            // Increment use counts for cached Q2 and Q3
            InterviewQuestionBank bankQ2 = cachedQ2.get();
            bankQ2.setUseCount(bankQ2.getUseCount() + 1);
            questionBankRepository.save(bankQ2);

            InterviewQuestionBank bankQ3 = cachedQ3.get();
            bankQ3.setUseCount(bankQ3.getUseCount() + 1);
            questionBankRepository.save(bankQ3);
        } else {
            log.info("Some cached questions missing. Generating standard Questions 1, 2, 3 using Gemini...");
            String aiResponse = geminiService.generateInitialQuestions(job.getDescription(), resume.getExtractedText(), targetRole, industry, difficulty.name());
            try {
                JsonNode questionsArray = objectMapper.readTree(aiResponse);
                if (questionsArray.isArray() && questionsArray.size() >= 3) {
                    for (int i = 0; i < 3; i++) {
                        JsonNode qNode = questionsArray.get(i);
                        String qText = qNode.path("question").asText();
                        String qCvCtx = qNode.path("cv_context").asText();
                        String qJdCtx = qNode.path("jd_context").asText();
                        boolean qCanReuse = qNode.path("can_reuse").asBoolean(true);
                        int order = i + 1;

                        // Save to Bank
                        InterviewQuestionBank bankQ = InterviewQuestionBank.builder()
                                .job(job)
                                .questionText(qText)
                                .questionType(QuestionTypeEnum.TECHNICAL)
                                .difficulty(difficulty)
                                .topic(targetRole)
                                .questionOrder(order)
                                .useCount(1)
                                .build();
                        questionBankRepository.save(bankQ);

                        if (order == 1) {
                            initialQuestionText = qText;
                            cvContext = qCvCtx;
                            jdContext = qJdCtx;
                            canReuse = qCanReuse;
                        }
                    }
                } else {
                    // Fallback if array parse fails
                    log.warn("Gemini didn't return an array of 3 questions, falling back to legacy single generator");
                    String legacyResponse = geminiService.generateInitialQuestion(job.getDescription(), resume.getExtractedText(), targetRole, industry, difficulty.name());
                    JsonNode legacyNode = objectMapper.readTree(legacyResponse);
                    initialQuestionText = legacyNode.path("question").asText();
                    cvContext = legacyNode.path("cv_context").asText();
                    jdContext = legacyNode.path("jd_context").asText();
                    canReuse = legacyNode.path("can_reuse").asBoolean(false);
                    
                    // Save Question 1 to Bank
                    InterviewQuestionBank bankQ1 = InterviewQuestionBank.builder()
                            .job(job)
                            .questionText(initialQuestionText)
                            .questionType(QuestionTypeEnum.TECHNICAL)
                            .difficulty(difficulty)
                            .topic(targetRole)
                            .questionOrder(1)
                            .useCount(1)
                            .build();
                    questionBankRepository.save(bankQ1);
                }
            } catch (Exception e) {
                log.error("Failed to parse initial questions JSON array, fallback to safe default question", e);
                initialQuestionText = "Hãy giới thiệu bản thân và tóm tắt những dự án nổi bật nhất mà bạn từng thực hiện.";
            }
        }

        InterviewQuestion question = InterviewQuestion.builder()
                .interviewSession(session)
                .questionText(initialQuestionText)
                .questionType(QuestionTypeEnum.TECHNICAL)
                .difficulty(difficulty)
                .questionOrder(1)
                .cvContext(cvContext)
                .jdContext(jdContext)
                .canReuse(canReuse)
                .build();
        questionRepository.save(question);

        return session;
    }

    @Transactional
    public InterviewSubmitAnswerResponseDTO submitAnswer(Long sessionId, String answerText) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != InterviewSessionStatusEnum.IN_PROGRESS) {
            throw new RuntimeException("Interview session is already finished");
        }

        // Find current active question
        List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        if (questions.isEmpty()) {
            throw new RuntimeException("No question found for this session");
        }
        InterviewQuestion currentQuestion = questions.get(questions.size() - 1);

        log.info("--- submitAnswer Diagnostic ---");
        log.info("Session ID: {}, maxQuestions: {}", session.getId(), session.getMaxQuestions());
        log.info("Questions in DB (size: {}):", questions.size());
        for (int i = 0; i < questions.size(); i++) {
            InterviewQuestion q = questions.get(i);
            log.info("  [{}] ID: {}, Order: {}, Text: '{}', HasAnswer: {}", 
                i, q.getId(), q.getQuestionOrder(), q.getQuestionText(), q.getInterviewAnswer() != null);
        }
        log.info("Selected currentQuestion ID: {}, Order: {}, Text: '{}'", 
            currentQuestion.getId(), currentQuestion.getQuestionOrder(), currentQuestion.getQuestionText());

        if (currentQuestion.getInterviewAnswer() != null) {
            throw new RuntimeException("The current question has already been answered");
        }

        // Save candidate answer
        InterviewAnswer answer = InterviewAnswer.builder()
                .interviewQuestion(currentQuestion)
                .answerText(answerText)
                .build();
        answer = answerRepository.save(answer);

        int currentOrder = currentQuestion.getQuestionOrder();
        boolean isFinished = currentOrder >= session.getMaxQuestions();

        String jobDesc = session.getApplication().getJob().getDescription();
        String targetRole = session.getApplication().getJob().getTitle();
        String industry = (session.getApplication().getResume().getBasicInfo() != null) 
                ? session.getApplication().getResume().getBasicInfo().getPredictedIndustry() : "IT";
        if (industry == null || industry.isEmpty()) {
            industry = "IT";
        }
        String level = session.getDifficultyLevel().name();

        int nextOrder = currentOrder + 1;
        InterviewQuestion nextQuestion = null;
        InterviewEvaluation evaluation = null;

        // Try lookup cached question in bank (applicable only for Standard Questions 2 and 3)
        java.util.Optional<InterviewQuestionBank> cachedNextQ = java.util.Optional.empty();
        if (!isFinished && nextOrder <= 3) {
            cachedNextQ = questionBankRepository.findByJobIdAndDifficultyAndQuestionOrder(
                    session.getApplication().getJob().getId(), session.getDifficultyLevel(), nextOrder);
        }

        // CASE A: Optimization - Evaluation Only path
        if (isFinished || cachedNextQ.isPresent()) {
            log.info("Executing Evaluation-Only path for session order: {}", currentOrder);
            String aiResponse = geminiService.evaluateAnswerOnly(currentQuestion.getQuestionText(), answerText, targetRole, industry, level);
            try {
                JsonNode resultNode = objectMapper.readTree(aiResponse);
                int score = resultNode.path("score").asInt(1);
                String feedback = resultNode.path("feedback").asText("");

                evaluation = InterviewEvaluation.builder()
                        .interviewAnswer(answer)
                        .score(score)
                        .feedback(feedback)
                        .build();
                evaluation = evaluationRepository.save(evaluation);

                // Save detailed scores per criteria
                saveCriteriaScores(answer, resultNode.path("scores"));

                // If next cached question is available, fetch and save to active session
                if (!isFinished && cachedNextQ.isPresent()) {
                    InterviewQuestionBank bankQ = cachedNextQ.get();
                    bankQ.setUseCount(bankQ.getUseCount() + 1);
                    questionBankRepository.save(bankQ);

                    nextQuestion = InterviewQuestion.builder()
                            .interviewSession(session)
                            .questionText(bankQ.getQuestionText())
                            .questionType(bankQ.getQuestionType())
                            .difficulty(bankQ.getDifficulty())
                            .questionOrder(nextOrder)
                            .build();
                    nextQuestion = questionRepository.save(nextQuestion);
                    
                    session.setTotalQuestions(nextOrder);
                    sessionRepository.save(session);
                }
            } catch (Exception e) {
                log.error("Failed to evaluate and load next cached question: {}", e.getMessage());
                throw new RuntimeException("Error evaluating answer: " + e.getMessage());
            }
        }
        // CASE B: Full Evaluation and Next Question generation path (PARALLEL COMPLETABLEFUTURE)
        else {
            log.info("Executing Parallel Evaluation & Question Generation path for session order: {}", currentOrder);
            
            // 1. Prepare running summary context
            final String runningSummary = session.getRunningSummary();
            final String finalQText = currentQuestion.getQuestionText();
            final String finalAnswerText = answerText;
            final String finalTargetRole = targetRole;
            final String finalIndustry = industry;
            final String finalLevel = level;
            final String finalJobDesc = jobDesc;
            
            // 2. Call Gemini concurrently
            java.util.concurrent.CompletableFuture<String> evalFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                geminiService.evaluateAnswerOnly(finalQText, finalAnswerText, finalTargetRole, finalIndustry, finalLevel)
            );
            
            java.util.concurrent.CompletableFuture<String> questionFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                geminiService.generateNextQuestion(finalJobDesc, runningSummary, finalQText, finalAnswerText, finalTargetRole, finalIndustry, finalLevel)
            );

            try {
                // Wait for both futures to complete
                java.util.concurrent.CompletableFuture.allOf(evalFuture, questionFuture).join();
                
                String evalResponse = evalFuture.get();
                String questionResponse = questionFuture.get();

                // 3. Process Evaluation Response
                JsonNode evalNode = objectMapper.readTree(evalResponse);
                int score = evalNode.path("score").asInt(1);
                String feedback = evalNode.path("feedback").asText("");

                evaluation = InterviewEvaluation.builder()
                        .interviewAnswer(answer)
                        .score(score)
                        .feedback(feedback)
                        .build();
                evaluation = evaluationRepository.save(evaluation);

                // Save detailed scores per criteria
                saveCriteriaScores(answer, evalNode.path("scores"));

                // 4. Process Question Generation Response
                JsonNode qNode = objectMapper.readTree(questionResponse);
                String nextQuestionText = qNode.path("question").asText();
                String cvCtx = qNode.path("cv_context").asText();
                String jdCtx = qNode.path("jd_context").asText();
                boolean canReuse = qNode.path("can_reuse").asBoolean(false);

                nextQuestion = InterviewQuestion.builder()
                        .interviewSession(session)
                        .questionText(nextQuestionText)
                        .questionType(QuestionTypeEnum.TECHNICAL)
                        .difficulty(session.getDifficultyLevel())
                        .questionOrder(nextOrder)
                        .cvContext(cvCtx)
                        .jdContext(jdCtx)
                        .canReuse(canReuse)
                        .build();
                nextQuestion = questionRepository.save(nextQuestion);

                session.setTotalQuestions(nextOrder);
                sessionRepository.save(session);

            } catch (Exception e) {
                log.error("Failed to execute parallel answer evaluation and question generation: {}", e.getMessage());
                throw new RuntimeException("Error evaluating answer: " + e.getMessage());
            }
        }

        // Trigger background running summary update (Non-blocking)
        if (evaluation != null) {
            final String currentSummary = session.getRunningSummary();
            final String qText = currentQuestion.getQuestionText();
            final String aText = answerText;
            final int currentScore = evaluation.getScore();
            final Long sessId = session.getId();
            
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    log.info("Running background update for session ID: {} runningSummary...", sessId);
                    String updatedSummary = geminiService.updateRunningSummary(currentSummary, qText, aText, currentScore);
                    
                    // Retrieve session and save
                    InterviewSession sess = sessionRepository.findById(sessId).orElse(null);
                    if (sess != null) {
                        sess.setRunningSummary(updatedSummary);
                        sessionRepository.save(sess);
                        log.info("Successfully updated runningSummary for session ID: {}", sessId);
                    }
                } catch (Exception ex) {
                    log.error("Failed to update runningSummary asynchronously for session ID: {}", sessId, ex);
                }
            });
        }

        return InterviewSubmitAnswerResponseDTO.builder()
                .evaluation(evaluation)
                .nextQuestion(nextQuestion)
                .isFinished(isFinished)
                .build();
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

        if (session.getStatus() == InterviewSessionStatusEnum.COMPLETED) {
            return session;
        }

        List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        String chatHistory = getChatHistoryForReport(questions);
        String jobDesc = session.getApplication().getJob().getDescription();

        String aiResponse = geminiService.generateFinalReport(jobDesc, chatHistory);

        try {
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
            log.error("Failed to parse Gemini final report response: {}", e.getMessage());
            throw new RuntimeException("Error generating final report: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<InterviewQuestion> getSessionQuestions(Long sessionId) {
        log.debug("Fetching questions for interview session ID: {}", sessionId);
        return questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
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
}
