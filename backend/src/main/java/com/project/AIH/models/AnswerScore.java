package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.CriteriaEnum;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "answer_scores", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"answer_id", "criteria"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private InterviewAnswer interviewAnswer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CriteriaEnum criteria;

    @Column(nullable = false)
    private Integer score; // 0-10

    @Column(columnDefinition = "TEXT")
    private String comment;

    private Instant createdAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
    }
}
