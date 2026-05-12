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
            log.info("Triggering final report generation for session ID: {}", sessionId);
            interviewService.generateReportSynchronously(sessionId);
            log.info("Successfully completed report generation for session ID: {}", sessionId);

        } catch (Exception e) {
            log.error("Failed to generate report for session ID: {}. Error: {}", sessionId, e.getMessage(), e);
            throw new RuntimeException("Report generation failed for session ID: " + sessionId, e);
        }
    }
}
