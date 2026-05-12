package com.project.AIH.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.InterviewScoringMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class InterviewScoringPublisher {
    
    private final ReliableMessagePublisher reliableMessagePublisher;
    private final ObjectMapper objectMapper;

    public void publishScoringJob(InterviewScoringMessage message) {
        log.info("Saving interview scoring job to outbox for answer ID: {}", message.getAnswerId());
        reliableMessagePublisher.publish(
                RabbitMQConfig.INTERVIEW_SCORING_EXCHANGE,
                RabbitMQConfig.INTERVIEW_SCORING_ROUTING_KEY,
                message
        );
    }
}
