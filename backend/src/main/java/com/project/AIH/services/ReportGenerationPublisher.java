package com.project.AIH.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.ReportGenerationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReportGenerationPublisher {

    private final ReliableMessagePublisher reliableMessagePublisher;
    private final ObjectMapper objectMapper;

    public void publishReportJob(ReportGenerationMessage message) {
        log.info("Saving report generation job to outbox for session ID: {}", message.getSessionId());
        reliableMessagePublisher.publish(
                RabbitMQConfig.REPORT_GENERATION_EXCHANGE,
                RabbitMQConfig.REPORT_GENERATION_ROUTING_KEY,
                message
        );
    }
}
