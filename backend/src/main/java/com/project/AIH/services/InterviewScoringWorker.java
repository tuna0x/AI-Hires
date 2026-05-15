package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.InterviewScoringMessage;
import com.project.AIH.dto.ReportGenerationMessage;
import com.project.AIH.models.InterviewAnswer;
import com.project.AIH.models.InterviewEvaluation;
import com.project.AIH.models.InterviewSession;
import com.project.AIH.repositories.InterviewAnswerRepository;
import com.project.AIH.repositories.InterviewEvaluationRepository;
import com.project.AIH.repositories.InterviewSessionRepository;
import com.project.AIH.utils.constant.InterviewSessionStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@Slf4j
@RequiredArgsConstructor
public class InterviewScoringWorker {

    private final GeminiService geminiService;
    private final InterviewAnswerRepository answerRepository;
    private final InterviewEvaluationRepository evaluationRepository;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewService interviewService;
    private final ObjectMapper objectMapper;
    private final ReportGenerationPublisher reportGenerationPublisher;

    @Value("${app.interview.scoring.max-retry-attempts:3}")
    private int maxRetryAttempts;

    @RabbitListener(queues = RabbitMQConfig.INTERVIEW_SCORING_QUEUE)
    @Transactional
    public void processInterviewScoring(Message amqpMessage) {
        final InterviewScoringMessage message;
        try {
            String messageJson = new String(amqpMessage.getBody());
            message = objectMapper.readValue(messageJson, InterviewScoringMessage.class);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to deserialize scoring message. Discarding. Body: {}",
                    new String(amqpMessage.getBody()), e);
            return;
        }

        final Long answerId = message.getAnswerId();
        final Long sessionId = message.getSessionId();
        log.info("Processing scoring for answer ID: {}, session ID: {}", answerId, sessionId);

        int attempts = 0;
        boolean success = false;

        while (attempts < maxRetryAttempts && !success) {
            try {
                attempts++;
                InterviewAnswer answer = answerRepository.findById(answerId)
                        .orElseThrow(() -> new RuntimeException("Answer not found: " + answerId));

                InterviewSession session = answer.getInterviewQuestion().getInterviewSession();
                String aiMergedRaw = geminiService.evaluateAndSummarizeAnswer(
                        session.getRunningSummary(),
                        message.getQuestionText(),
                        message.getAnswerText(),
                        message.getTargetRole(),
                        message.getIndustry(),
                        message.getLevel()
                );

                JsonNode root = objectMapper.readTree(aiMergedRaw);
                JsonNode evalNode = root.path("evaluation");
                int score = evalNode.path("score").asInt(0);
                String feedback = evalNode.path("feedback").asText("");
                String updatedSummary = root.path("updated_summary").asText("");

                InterviewEvaluation evaluation = InterviewEvaluation.builder()
                        .interviewAnswer(answer)
                        .score(score)
                        .feedback(feedback)
                        .build();

                evaluation = evaluationRepository.save(evaluation);
                answer.setInterviewEvaluation(evaluation);
                answerRepository.save(answer);

                interviewService.saveCriteriaScores(answer, evalNode.path("scores"));

                if (updatedSummary != null && !updatedSummary.isEmpty()) {
                    session.setRunningSummary(updatedSummary);
                    sessionRepository.save(session);
                    log.info("Updated runningSummary for session ID: {}", session.getId());
                }

                log.info("Successfully evaluated answer ID: {}, score: {}", answerId, score);
                success = true;
            } catch (Exception e) {
                if (attempts >= maxRetryAttempts) {
                    log.error("Failed to process interview scoring for answer ID: {} after {} attempts. Error: {}",
                            answerId, attempts, e.getMessage());
                    saveFallbackScore(answerId, "AI scoring unavailable after multiple attempts. Please skip this answer.");
                } else {
                    log.warn("Attempt {}/{} failed for answer ID: {}. Retrying in 2 seconds...",
                            attempts, maxRetryAttempts, answerId);
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }

        checkAndTriggerReportGeneration(sessionId);
    }

    private void saveFallbackScore(Long answerId, String feedback) {
        try {
            InterviewAnswer answer = answerRepository.findById(answerId).orElse(null);
            if (answer != null && answer.getInterviewEvaluation() == null) {
                InterviewEvaluation fallbackEval = InterviewEvaluation.builder()
                        .interviewAnswer(answer)
                        .score(0)
                        .feedback(feedback)
                        .build();
                fallbackEval = evaluationRepository.save(fallbackEval);
                answer.setInterviewEvaluation(fallbackEval);
                answerRepository.save(answer);
                log.info("Saved fallback score 0 for answer ID: {}", answerId);
            }
        } catch (Exception ex) {
            log.error("Failed to save fallback score for answer ID: {}", answerId, ex);
        }
    }

    private void checkAndTriggerReportGeneration(Long sessionId) {
        if (sessionId == null) {
            return;
        }

        try {
            long pendingCount = answerRepository.countPendingEvaluationsNative(sessionId);
            long answeredCount = answerRepository.countTotalAnswersNative(sessionId);
            InterviewSession session = sessionRepository.findById(sessionId).orElse(null);

            int requiredAnswers = (session != null && session.getMaxQuestions() != null) ? session.getMaxQuestions() : 5;
            if (pendingCount == 0 && answeredCount >= requiredAnswers
                    && session != null
                    && (session.getStatus() == InterviewSessionStatusEnum.IN_PROGRESS
                    || session.getStatus() == InterviewSessionStatusEnum.REPORT_GENERATING)) {

                log.info("Session {} progress: pending={}, answered={}/{}. Status={}. Triggering report.",
                        sessionId, pendingCount, answeredCount, requiredAnswers, session.getStatus());

                if (TransactionSynchronizationManager.isSynchronizationActive()) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            publishReportMessage(sessionId);
                        }
                    });
                } else {
                    publishReportMessage(sessionId);
                }
            }
        } catch (Exception ex) {
            log.error("Failed to check/trigger report generation for session ID: {}", sessionId, ex);
        }
    }

    private void publishReportMessage(Long sessionId) {
        try {
            log.info("Publishing report generation job for session: {}", sessionId);
            ReportGenerationMessage reportMessage = ReportGenerationMessage.builder()
                    .sessionId(sessionId)
                    .build();
            reportGenerationPublisher.publishReportJob(reportMessage);
        } catch (Exception ex) {
            log.error("Failed to publish report job for session ID: {}", sessionId, ex);
        }
    }
}
