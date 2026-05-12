package com.project.AIH.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.models.OutboxMessage;
import com.project.AIH.repositories.OutboxMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReliableMessagePublisher {
    private final OutboxMessageRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public void publish(String exchange, String routingKey, Object message) {
        try {
            String payload = objectMapper.writeValueAsString(message);
            OutboxMessage outbox = OutboxMessage.builder()
                    .exchange(exchange)
                    .routingKey(routingKey)
                    .payload(payload)
                    .status("PENDING")
                    .build();
            outboxRepository.save(outbox);
            log.info("Saved message to outbox for exchange: {}, routingKey: {}", exchange, routingKey);
        } catch (Exception e) {
            log.error("Failed to save message to outbox", e);
            throw new RuntimeException("Failed to save message to outbox", e);
        }
    }
}
