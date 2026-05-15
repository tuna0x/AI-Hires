package com.project.AIH.services;

import com.project.AIH.models.OutboxMessage;
import com.project.AIH.repositories.OutboxMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxRelayWorker {
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_PROCESSING = "PROCESSING";
    private static final String STATUS_PROCESSED = "PROCESSED";
    private static final String STATUS_FAILED = "FAILED";

    private final OutboxMessageRepository outboxRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.outbox.max-retries:5}")
    private int maxRetries;

    @Scheduled(fixedDelayString = "${app.outbox.poll-rate-ms:10000}")
    public void relayMessages() {
        List<OutboxMessage> pendingMessages = outboxRepository.findTop50ByStatusOrderByCreatedAtAsc(STATUS_PENDING);
        
        if (pendingMessages.isEmpty()) {
            return;
        }

        log.debug("Found {} pending messages in outbox. Relaying...", pendingMessages.size());

        for (OutboxMessage msg : pendingMessages) {
            if (!claimMessage(msg.getId())) {
                continue;
            }
            try {
                org.springframework.amqp.core.Message message = org.springframework.amqp.core.MessageBuilder
                        .withBody(msg.getPayload().getBytes(StandardCharsets.UTF_8))
                        .setContentType("application/json")
                        .build();
                
                rabbitTemplate.send(msg.getExchange(), msg.getRoutingKey(), message);
                
                msg.setStatus(STATUS_PROCESSED);
                msg.setProcessedAt(Instant.now());
                outboxRepository.save(msg);
                log.info("Relayed message ID: {} to exchange: {}", msg.getId(), msg.getExchange());
            } catch (Exception e) {
                log.error("Failed to relay message ID: {}. Error: {}", msg.getId(), e.getMessage());
                int retryCount = msg.getRetryCount() == null ? 0 : msg.getRetryCount();
                msg.setRetryCount(retryCount + 1);
                if (msg.getRetryCount() >= maxRetries) {
                    msg.setStatus(STATUS_FAILED);
                } else {
                    msg.setStatus(STATUS_PENDING);
                }
                outboxRepository.save(msg);
            }
        }
    }

    private boolean claimMessage(Long messageId) {
        return outboxRepository.claimStatus(messageId, STATUS_PENDING, STATUS_PROCESSING) == 1;
    }
}
