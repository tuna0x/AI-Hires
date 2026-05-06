package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "scoring_rules", indexes = {
    @Index(name = "idx_rule_code", columnList = "ruleCode", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ruleCode;

    private String category;
    private String criteriaName;

    @Column(precision = 5, scale = 2)
    private BigDecimal maxScore;
    
    @Builder.Default
    @Column(precision = 4, scale = 2)
    private BigDecimal weight = BigDecimal.ONE;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Boolean isActive = true;

    private String version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company; // nullable for global rules
}
