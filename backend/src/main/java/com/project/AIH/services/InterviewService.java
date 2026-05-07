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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public List<InterviewSession> getSessionsByUser(User user) {
        log.info("Fetching interview sessions for user ID: {}", user.getId());
        return sessionRepository.findByUserId(user.getId());
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

        // --- HYBRID FLOW: Question 1 lookup and cache ---
        String initialQuestionText = null;
        String cvContext = null;
        String jdContext = null;
        Boolean canReuse = false;

        java.util.Optional<InterviewQuestionBank> cachedQ = questionBankRepository
                .findByJobIdAndDifficultyAndQuestionOrder(job.getId(), difficulty, 1);

        if (cachedQ.isPresent()) {
            log.info("Loaded cached Question 1 from Bank for Job ID: {}, Level: {}", job.getId(), difficulty);
            InterviewQuestionBank qBank = cachedQ.get();
            initialQuestionText = qBank.getQuestionText();
            qBank.setUseCount(qBank.getUseCount() + 1);
            questionBankRepository.save(qBank);
        } else {
            log.info("No cached question found. Generating standard Question 1 using Gemini for Job ID: {}, Level: {}", job.getId(), difficulty);
            String aiResponse = geminiService.generateInitialQuestion(job.getDescription(), resume.getExtractedText(), targetRole, industry, difficulty.name());
            try {
                JsonNode resultNode = objectMapper.readTree(aiResponse);
                initialQuestionText = resultNode.path("question").asText();
                cvContext = resultNode.path("cv_context").asText();
                jdContext = resultNode.path("jd_context").asText();
                canReuse = resultNode.path("can_reuse").asBoolean(false);

                // Auto cache standard Q1 if reusable and linked to a real job description
                if (canReuse && job.getId() != null) {
                    InterviewQuestionBank qBank = InterviewQuestionBank.builder()
                            .job(job)
                            .questionText(initialQuestionText)
                            .questionType(QuestionTypeEnum.TECHNICAL)
                            .difficulty(difficulty)
                            .topic(targetRole)
                            .questionOrder(1)
                            .useCount(1)
                            .build();
                    questionBankRepository.save(qBank);
                }
            } catch (Exception e) {
                log.warn("Failed to parse initial question JSON, fallback to raw text response", e);
                initialQuestionText = aiResponse;
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
        // CASE B: Full Evaluation and Next Question generation path
        else {
            log.info("Executing Full Evaluation & Question Generation path for session order: {}", currentOrder);
            String chatHistory = getChatHistory(questions, answerText);
            String aiResponse = geminiService.evaluateAndGenerateNextQuestion(jobDesc, chatHistory, answerText, targetRole, industry, level);
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

                // Parse next question details
                JsonNode nextQNode = resultNode.path("next_question");
                String nextQuestionText = nextQNode.isObject() ? nextQNode.path("question").asText() : resultNode.path("next_question").asText();
                String cvCtx = nextQNode.isObject() ? nextQNode.path("cv_context").asText() : null;
                String jdCtx = nextQNode.isObject() ? nextQNode.path("jd_context").asText() : null;
                boolean canReuse = nextQNode.isObject() ? nextQNode.path("can_reuse").asBoolean(false) : false;

                // Cache next question to Bank if marked as reusable (only applicable to Standard Q2, Q3)
                if (nextOrder <= 3 && canReuse) {
                    InterviewQuestionBank bankQ = InterviewQuestionBank.builder()
                            .job(session.getApplication().getJob())
                            .questionText(nextQuestionText)
                            .questionType(QuestionTypeEnum.TECHNICAL)
                            .difficulty(session.getDifficultyLevel())
                            .topic(targetRole)
                            .questionOrder(nextOrder)
                            .useCount(1)
                            .build();
                    questionBankRepository.save(bankQ);
                    log.info("Cached newly generated Question {} in Bank for Job ID: {}", nextOrder, session.getApplication().getJob().getId());
                }

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
                log.error("Failed to execute full answer evaluation: {}", e.getMessage());
                throw new RuntimeException("Error evaluating answer: " + e.getMessage());
            }
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
