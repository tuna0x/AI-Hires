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

    @Transactional
    public InterviewSession startSession(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        InterviewSession session = InterviewSession.builder()
                .application(application)
                .status(InterviewSessionStatusEnum.IN_PROGRESS)
                .interviewType(InterviewTypeEnum.MIXED)
                .difficultyLevel(DifficultyLevelEnum.ADAPTIVE)
                .totalQuestions(1)
                .maxQuestions(5)
                .build();
        session = sessionRepository.save(session);

        String jobDesc = application.getJob().getDescription();
        String cvText = application.getResume().getExtractedText();

        String initialQuestionText = geminiService.generateInitialQuestion(jobDesc, cvText);

        InterviewQuestion question = InterviewQuestion.builder()
                .interviewSession(session)
                .questionText(initialQuestionText)
                .questionType(QuestionTypeEnum.TECHNICAL)
                .difficulty(DifficultyLevelEnum.EASY)
                .questionOrder(1)
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

        // 1. Find the current active question (the latest ordered question)
        List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        if (questions.isEmpty()) {
            throw new RuntimeException("No question found for this session");
        }
        InterviewQuestion currentQuestion = questions.get(questions.size() - 1);

        if (currentQuestion.getInterviewAnswer() != null) {
            throw new RuntimeException("The current question has already been answered");
        }

        // 2. Save candidate answer
        InterviewAnswer answer = InterviewAnswer.builder()
                .interviewQuestion(currentQuestion)
                .answerText(answerText)
                .build();
        answer = answerRepository.save(answer);

        // 3. Fetch chat history for Gemini context
        String chatHistory = getChatHistory(questions, answerText);
        String jobDesc = session.getApplication().getJob().getDescription();

        // 4. Evaluate and generate next question
        String aiResponse = geminiService.evaluateAndGenerateNextQuestion(jobDesc, chatHistory, answerText);
        
        try {
            JsonNode resultNode = objectMapper.readTree(aiResponse);
            int score = resultNode.path("score").asInt();
            String feedback = resultNode.path("feedback").asText();
            String nextQuestionText = resultNode.path("next_question").asText();

            // 5. Save AI Evaluation
            InterviewEvaluation evaluation = InterviewEvaluation.builder()
                    .interviewAnswer(answer)
                    .score(score)
                    .feedback(feedback)
                    .build();
            evaluation = evaluationRepository.save(evaluation);

            // 6. Check if we should ask the next question or finish
            boolean isFinished = session.getTotalQuestions() >= session.getMaxQuestions();
            InterviewQuestion nextQuestion = null;

            if (!isFinished) {
                // Increment total questions and save next question
                int nextOrder = session.getTotalQuestions() + 1;
                session.setTotalQuestions(nextOrder);
                sessionRepository.save(session);

                nextQuestion = InterviewQuestion.builder()
                        .interviewSession(session)
                        .questionText(nextQuestionText)
                        .questionType(QuestionTypeEnum.TECHNICAL)
                        .difficulty(DifficultyLevelEnum.MEDIUM)
                        .questionOrder(nextOrder)
                        .build();
                nextQuestion = questionRepository.save(nextQuestion);
            }

            return InterviewSubmitAnswerResponseDTO.builder()
                    .evaluation(evaluation)
                    .nextQuestion(nextQuestion)
                    .isFinished(isFinished)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse Gemini evaluation response: {}", e.getMessage());
            throw new RuntimeException("Error evaluating answer: " + e.getMessage());
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
                log.warn("Invalid decision string: {}, defaulting to CONSIDER", decisionStr);
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
        // If the latest answer is not yet mapped in db relations
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
