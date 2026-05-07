package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.DifficultyLevelEnum;
import com.project.AIH.utils.constant.QuestionTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "interview_question_bank", indexes = {
    @Index(name = "idx_interview_qbank_job_diff_order", columnList = "job_id, difficulty, question_order")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewQuestionBank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    @JsonIgnore
    @ToString.Exclude
    private Job job;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private QuestionTypeEnum questionType;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private DifficultyLevelEnum difficulty;

    private String topic;

    @Column(columnDefinition = "TEXT")
    private String sampleAnswer;

    @Column(name = "question_order")
    private Integer questionOrder;

    @Builder.Default
    private Integer useCount = 0;

    private Instant createdAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
        if (this.useCount == null) {
            this.useCount = 0;
        }
    }
}
