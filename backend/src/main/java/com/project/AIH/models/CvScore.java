package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import com.project.AIH.utils.SecurityUtil;

@Entity
@Table(
    name = "cv_scores",
    indexes = {
        @Index(name = "idx_cv_scores_app_id", columnList = "application_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    @JsonIgnore
    @ToString.Exclude
    private Application application;

    @Column(precision = 5, scale = 2)
    private BigDecimal totalScore;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal stage1Score;
    @Column(precision = 5, scale = 2)
    private BigDecimal stage2Score;
    @Column(precision = 5, scale = 2)
    private BigDecimal stage3Score;
    @Column(precision = 5, scale = 2)
    private BigDecimal stage4Score;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @OneToMany(mappedBy = "cvScore", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CvScoreInsight> insights;

    private String scoringVersion;
    
    private Instant scoredAt;

    private Integer userRating;
    @Column(columnDefinition = "TEXT")
    private String userFeedback;

    @Column(columnDefinition = "LONGTEXT")
    private String rawAiResponse;

    @OneToMany(mappedBy = "cvScore", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScoreDetail> scoreDetails;

    @PrePersist
    public void handleBeforeCreate() {
        if (this.scoredAt == null) {
            this.scoredAt = Instant.now();
        }
    }
}
