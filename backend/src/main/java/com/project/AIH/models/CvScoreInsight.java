package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.InsightTypeEnum;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "cv_score_insights",
    indexes = {
        @Index(name = "idx_cv_score_insights_score_id", columnList = "cv_score_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvScoreInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cv_score_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private CvScore cvScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InsightTypeEnum type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer priority;

    private Integer displayOrder;
}
