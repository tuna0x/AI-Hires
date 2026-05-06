package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.InterviewDecisionEnum;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Entity
@Table(
    name = "interview_reports",
    indexes = {
        @Index(name = "idx_interview_reports_session_id", columnList = "session_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    @JsonIgnore
    @ToString.Exclude
    private InterviewSession interviewSession;

    @Column(precision = 5, scale = 2)
    private BigDecimal finalScore;

    @Enumerated(EnumType.STRING)
    private InterviewDecisionEnum decision;

    @OneToMany(mappedBy = "interviewReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InterviewInsight> insights;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    private Integer technicalScore;
    private Integer communicationScore;
    private Integer problemSolvingScore;

    private Instant createdAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
    }
}
