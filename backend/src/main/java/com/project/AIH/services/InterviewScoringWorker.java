package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.InterviewScoringMessage;
import com.project.AIH.models.InterviewAnswer;
import com.project.AIH.models.InterviewEvaluation;
import com.project.AIH.models.InterviewSession;
import com.project.AIH.repositories.InterviewAnswerRepository;
import com.project.AIH.repositories.InterviewEvaluationRepository;
import com.project.AIH.repositories.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class InterviewScoringWorker {

    private final GeminiService geminiService;
    private final InterviewAnswerRepository answerRepository;
    private final InterviewEvaluationRepository evaluationRepository;
    private final InterviewSessionRepository sessionRepository;
    private final ObjectMapper objectMapper;
    private final com.project.AIH.services.ReportGenerationPublisher reportGenerationPublisher;

    @RabbitListener(queues = RabbitMQConfig.INTERVIEW_SCORING_QUEUE)
    @Transactional
    public void processInterviewScoring(InterviewScoringMessage message) {
        log.info("Received Interview Scoring message for answer: {}", message.getAnswerId());

        try {
            InterviewAnswer answer = answerRepository.findById(message.getAnswerId())
                    .orElseThrow(() -> new RuntimeException("Answer not found: " + message.getAnswerId()));

            // Call Gemini to evaluate
            String aiEvalRaw = geminiService.evaluateAnswerOnly(
                    message.getQuestionText(),
                    message.getAnswerText(),
                    message.getTargetRole(),
                    message.getIndustry(),
                    message.getLevel()
            );

            // Parse response
            JsonNode root = objectMapper.readTree(aiEvalRaw);
            int score = root.path("score").asInt(0);
            String feedback = root.path("feedback").asText("");

            InterviewEvaluation evaluation = InterviewEvaluation.builder()
                    .interviewAnswer(answer)
                    .score(score)
                    .feedback(feedback)
                    .build();

            evaluation = evaluationRepository.saveAndFlush(evaluation);
            answer.setInterviewEvaluation(evaluation);
            answerRepository.saveAndFlush(answer);

            // Update running summary
            InterviewSession session = answer.getInterviewQuestion().getInterviewSession();
            try {
                String updatedSummary = geminiService.updateRunningSummary(
                        session.getRunningSummary(), 
                        message.getQuestionText(), 
                        message.getAnswerText(), 
                        score
                );
                session.setRunningSummary(updatedSummary);
                sessionRepository.saveAndFlush(session);
            } catch (Exception ex) {
                log.error("Failed to update runningSummary for session ID: {}", session.getId(), ex);
            }

            log.info("Successfully evaluated answer ID: {}, score: {}", message.getAnswerId(), score);

        } catch (Exception e) {
            log.error("Failed to process interview scoring for message: {}. Error: {}", message, e.getMessage());
            
            // Fallback: Save a 0 score so the UI doesn't hang in 'pending' forever
            try {
                InterviewAnswer answer = answerRepository.findById(message.getAnswerId()).orElse(null);
                if (answer != null) {
                    InterviewEvaluation evaluation = InterviewEvaluation.builder()
                            .interviewAnswer(answer)
                            .score(0)
                            .feedback("Hệ thống AI hiện đang quá tải và không thể chấm điểm câu trả lời này. Vui lòng bỏ qua.")
                            .build();
                    evaluation = evaluationRepository.saveAndFlush(evaluation);
                    answer.setInterviewEvaluation(evaluation);
                    answerRepository.saveAndFlush(answer);
                    log.info("Saved fallback score 0 for answer ID: {}", message.getAnswerId());
                }
            } catch (Exception ex) {
                log.error("Failed to save fallback score for answer ID: {}", message.getAnswerId(), ex);
            }
        }

        // Event-driven report generation trigger: Check if all answers are scored
        try {
            Long sessionId = message.getSessionId();
            if (sessionId != null) {
                long pendingCount = answerRepository.countPendingEvaluationsNative(sessionId);
                long answeredCount = answerRepository.countTotalAnswersNative(sessionId);
                log.info("Session {} progress check: pending={}, answered={}", sessionId, pendingCount, answeredCount);
                if (pendingCount == 0 && answeredCount >= 5) {
                    if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
                        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                            new org.springframework.transaction.support.TransactionSynchronization() {
                                @Override
                                public void afterCommit() {
                                    try {
                                        log.info("All answers scored and transaction committed for session {}. Triggering final report generation.", sessionId);
                                        com.project.AIH.dto.ReportGenerationMessage reportMessage = 
                                                com.project.AIH.dto.ReportGenerationMessage.builder()
                                                        .sessionId(sessionId)
                                                        .build();
                                        reportGenerationPublisher.publishReportJob(reportMessage);
                                    } catch (Exception ex) {
                                        log.error("Failed to publish report job after commit for session ID: {}", sessionId, ex);
                                    }
                                }
                            }
                        );
                    } else {
                        log.info("All answers scored for session {} (no active transaction). Triggering report generation directly.", sessionId);
                        com.project.AIH.dto.ReportGenerationMessage reportMessage = 
                                com.project.AIH.dto.ReportGenerationMessage.builder()
                                        .sessionId(sessionId)
                                        .build();
                        reportGenerationPublisher.publishReportJob(reportMessage);
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Failed to check or trigger report generation at the end of processInterviewScoring for message: {}", message, ex);
        }
    }
}
