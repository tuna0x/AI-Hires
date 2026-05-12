package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.InterviewScoringMessage;
import com.project.AIH.dto.ReportGenerationMessage;
import com.project.AIH.models.InterviewAnswer;
import com.project.AIH.models.InterviewEvaluation;
import com.project.AIH.models.InterviewSession;
import com.project.AIH.models.AnswerScore;
import com.project.AIH.repositories.AnswerScoreRepository;
import com.project.AIH.repositories.InterviewAnswerRepository;
import com.project.AIH.repositories.InterviewEvaluationRepository;
import com.project.AIH.repositories.InterviewSessionRepository;
import com.project.AIH.utils.constant.CriteriaEnum;
import com.project.AIH.utils.constant.InterviewSessionStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
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
    private final AnswerScoreRepository answerScoreRepository;
    private final ObjectMapper objectMapper;
    private final ReportGenerationPublisher reportGenerationPublisher;

    @RabbitListener(queues = RabbitMQConfig.INTERVIEW_SCORING_QUEUE)
    @Transactional
    public void processInterviewScoring(Message amqpMessage) {
        // Step 1: Deserialize the message. If this fails, discard the message.
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

        // Step 2: Evaluate the answer
        try {
            InterviewAnswer answer = answerRepository.findById(answerId)
                    .orElseThrow(() -> new RuntimeException("Answer not found: " + answerId));

            InterviewSession session = answer.getInterviewQuestion().getInterviewSession();

            // Call Gemini to evaluate and summarize in a single step (Cost Optimization)
            String aiMergedRaw = geminiService.evaluateAndSummarizeAnswer(
                    session.getRunningSummary(),
                    message.getQuestionText(),
                    message.getAnswerText(),
                    message.getTargetRole(),
                    message.getIndustry(),
                    message.getLevel()
            );

            // Parse merged response
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

            evaluation = evaluationRepository.saveAndFlush(evaluation);
            answer.setInterviewEvaluation(evaluation);
            answerRepository.saveAndFlush(answer);

            // Save sub-scores for criteria
            saveCriteriaScores(answer, evalNode.path("scores"));

            // Update running summary
            if (updatedSummary != null && !updatedSummary.isEmpty()) {
                session.setRunningSummary(updatedSummary);
                sessionRepository.saveAndFlush(session);
                log.info("Updated runningSummary for session ID: {}", session.getId());
            }

            log.info("Successfully evaluated answer ID: {}, score: {}", answerId, score);

        } catch (Exception e) {
            log.error("Failed to process interview scoring for answer ID: {}. Error: {}", answerId, e.getMessage());

            // Fallback: Save a 0 score so the UI doesn't hang in 'pending' forever
            try {
                InterviewAnswer answer = answerRepository.findById(answerId).orElse(null);
                if (answer != null && answer.getInterviewEvaluation() == null) {
                    InterviewEvaluation fallbackEval = InterviewEvaluation.builder()
                            .interviewAnswer(answer)
                            .score(0)
                            .feedback("Hệ thống AI hiện đang quá tải và không thể chấm điểm câu trả lời này. Vui lòng bỏ qua.")
                            .build();
                    fallbackEval = evaluationRepository.saveAndFlush(fallbackEval);
                    answer.setInterviewEvaluation(fallbackEval);
                    answerRepository.saveAndFlush(answer);
                    log.info("Saved fallback score 0 for answer ID: {}", answerId);
                }
            } catch (Exception ex) {
                log.error("Failed to save fallback score for answer ID: {}", answerId, ex);
            }
        }

        // Step 3: Event-driven report generation trigger
        checkAndTriggerReportGeneration(sessionId);
    }

    /**
     * Checks if all answers for a session have been scored. If so, triggers report generation.
     */
    private void checkAndTriggerReportGeneration(Long sessionId) {
        if (sessionId == null) return;

        try {
            long pendingCount = answerRepository.countPendingEvaluationsNative(sessionId);
            long answeredCount = answerRepository.countTotalAnswersNative(sessionId);

            InterviewSession session = sessionRepository.findById(sessionId).orElse(null);

            if (pendingCount == 0 && answeredCount >= 5
                    && session != null
                    && session.getStatus() == InterviewSessionStatusEnum.IN_PROGRESS) {

                log.info("Session {} progress: pending={}, answered={}. Status=IN_PROGRESS. Triggering report.",
                        sessionId, pendingCount, answeredCount);

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
}
