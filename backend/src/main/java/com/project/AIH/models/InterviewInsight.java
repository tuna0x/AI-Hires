package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.InsightTypeEnum;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "interview_insights",
    indexes = {
        @Index(name = "idx_interview_insights_report_id", columnList = "report_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private InterviewReport interviewReport;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InsightTypeEnum type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer displayOrder;
}
