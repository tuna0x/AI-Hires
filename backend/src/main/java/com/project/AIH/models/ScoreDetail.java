package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
    name = "score_details",
    indexes = {
        @Index(name = "idx_score_details_cv_score_id", columnList = "cv_score_id"),
        @Index(name = "idx_score_details_rule_id", columnList = "scoring_rule_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cv_score_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private CvScore cvScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scoring_rule_id")
    private ScoringRule scoringRule;

    private String category;
    private String criteriaName;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal score;
    @Column(precision = 5, scale = 2)
    private BigDecimal maxScore;

    @Column(columnDefinition = "TEXT")
    private String explanation;
}
