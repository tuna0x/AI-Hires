package com.project.AIH.services;

import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.ReportGenerationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReportGenerationPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishReportJob(ReportGenerationMessage message) {
        log.info("Publishing report generation job for session ID: {}", message.getSessionId());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.REPORT_GENERATION_EXCHANGE,
                RabbitMQConfig.REPORT_GENERATION_ROUTING_KEY,
                message
        );
    }
}
