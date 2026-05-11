package com.project.AIH.services;

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
    
    private final RabbitTemplate rabbitTemplate;

    public void publishScoringJob(InterviewScoringMessage message) {
        log.info("Publishing interview scoring job for answer ID: {}", message.getAnswerId());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.INTERVIEW_SCORING_EXCHANGE,
                RabbitMQConfig.INTERVIEW_SCORING_ROUTING_KEY,
                message
        );
    }
}
