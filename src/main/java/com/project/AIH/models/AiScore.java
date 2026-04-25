package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;
import com.project.AIH.utils.SecurityUtil;
import java.time.Instant;

@Entity
@Table(name = "ai_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    private double totalScore;

    @Column(columnDefinition = "TEXT")
    private String scoreBreakdown; // JSON breakdown

    @Column(columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(columnDefinition = "TEXT")
    private String aiSuggestions;

    @Column(columnDefinition = "LONGTEXT")
    private String detailedResult; // To store the full 4-stage evaluation JSON

    // Audit fields
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdBy = SecurityUtil.getCurrentUserLogin().orElse("SYSTEM");
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedBy = SecurityUtil.getCurrentUserLogin().orElse("SYSTEM");
        this.updatedAt = Instant.now();
    }
}
