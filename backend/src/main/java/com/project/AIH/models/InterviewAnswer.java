package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(
    name = "interview_answers",
    indexes = {
        @Index(name = "idx_interview_answers_question_id", columnList = "question_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    @JsonIgnore
    @ToString.Exclude
    private InterviewQuestion interviewQuestion;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String answerText;

    private Instant answeredAt;

    private Integer responseTimeSeconds;

    @OneToOne(mappedBy = "interviewAnswer", cascade = CascadeType.ALL)
    private InterviewEvaluation interviewEvaluation;

    @PrePersist
    public void handleBeforeCreate() {
        this.answeredAt = Instant.now();
    }
}
