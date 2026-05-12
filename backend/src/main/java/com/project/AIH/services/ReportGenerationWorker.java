package com.project.AIH.services;

import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.ReportGenerationMessage;
import com.project.AIH.models.InterviewQuestion;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.REPORT_GENERATION_QUEUE)
    public void processReportGeneration(org.springframework.amqp.core.Message amqpMessage) {
        log.info("Received Report Generation message via AMQP Message");

        try {
            String messageJson = new String(amqpMessage.getBody());
            ReportGenerationMessage message = objectMapper.readValue(messageJson, ReportGenerationMessage.class);
            Long sessionId = message.getSessionId();
            log.info("Processing report generation for session: {}", sessionId);

            log.info("Triggering final report generation for session ID: {}", sessionId);
            interviewService.generateReportSynchronously(sessionId);
            log.info("Successfully completed report generation for session ID: {}", sessionId);

        } catch (Exception e) {
            log.error("Failed to process report generation message. Error: {}", e.getMessage(), e);
            // We don't want to throw an exception here because it might cause infinite retry 
            // if the JSON is invalid. In a real system, we'd send to DLQ.
        }
    }
}
