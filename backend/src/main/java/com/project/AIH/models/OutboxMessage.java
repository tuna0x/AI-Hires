package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "outbox_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String exchange;

    @Column(nullable = false)
    private String routingKey;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    @Builder.Default
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, PROCESSED, FAILED

    @Builder.Default
    private Integer retryCount = 0;

    private Instant createdAt;
    private Instant processedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
