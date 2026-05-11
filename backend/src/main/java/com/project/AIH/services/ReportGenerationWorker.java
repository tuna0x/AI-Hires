package com.project.AIH.services;

import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.ReportGenerationMessage;
import com.project.AIH.models.InterviewQuestion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReportGenerationWorker {

    private final InterviewService interviewService;
    private final GeminiService geminiService;

    @RabbitListener(queues = RabbitMQConfig.REPORT_GENERATION_QUEUE)
    public void processReportGeneration(ReportGenerationMessage message) {
        Long sessionId = message.getSessionId();
        log.info("Received Report Generation message for session: {}", sessionId);

        try {
            // Poll to wait for all answers to be scored
            boolean allScored = false;
            int maxAttempts = 25; // 50 seconds max wait
            int attempt = 0;

            while (!allScored && attempt < maxAttempts) {
                attempt++;
                long pendingCount = interviewService.getPendingEvaluationsCount(sessionId);
                long answeredCount = interviewService.getAnsweredCount(sessionId);

                // If all answers that have been submitted are scored, we are good.
                // Normally for finishSession, we expect exactly 5 answered questions.
                if (pendingCount == 0 && answeredCount >= 5) {
                    allScored = true;
                    log.info("All 5 questions are scored for session {}. Proceeding to report generation.", sessionId);
                } else {
                    log.info("Attempt {}/{}: Waiting for answers to be scored for session {}. Pending={}, Answered={}/5", 
                            attempt, maxAttempts, sessionId, pendingCount, answeredCount);
                    Thread.sleep(2000);
                }
            }

            // Even if not all scored (timeout), generate report based on whatever is available
            log.info("Triggering final report generation for session ID: {}", sessionId);
            interviewService.generateReportSynchronously(sessionId);
            log.info("Successfully completed report generation for session ID: {}", sessionId);

        } catch (Exception e) {
            log.error("Failed to generate report for session ID: {}. Error: {}", sessionId, e.getMessage(), e);
        }
    }
}
