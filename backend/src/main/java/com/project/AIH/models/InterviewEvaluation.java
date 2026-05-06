package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(
    name = "interview_evaluations",
    indexes = {
        @Index(name = "idx_interview_evals_answer_id", columnList = "answer_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false, unique = true)
    @JsonIgnore
    @ToString.Exclude
    private InterviewAnswer interviewAnswer;

    private Integer score; // 1-10

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(columnDefinition = "TEXT")
    private String matchedKeywords; // JSON array

    @Column(columnDefinition = "TEXT")
    private String missedKeywords; // JSON array

    @Column(columnDefinition = "TEXT")
    private String improvementSuggestion;

    private Instant createdAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
    }
}
