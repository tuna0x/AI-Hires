package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.DifficultyLevelEnum;
import com.project.AIH.utils.constant.QuestionTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import com.project.AIH.utils.SecurityUtil;
import java.time.Instant;

@Entity
@Table(name = "interview_questions", indexes = {
    @Index(name = "idx_interview_questions_session_id", columnList = "session_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private InterviewSession interviewSession;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    private QuestionTypeEnum questionType;

    @Enumerated(EnumType.STRING)
    private DifficultyLevelEnum difficulty;

    private String topic;

    @Column(columnDefinition = "TEXT")
    private String expectedKeywords; // JSON array

    private Integer questionOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_question_id")
    @JsonIgnore
    @ToString.Exclude
    private InterviewQuestion parentQuestion;

    @OneToOne(mappedBy = "interviewQuestion", cascade = CascadeType.ALL)
    private InterviewAnswer interviewAnswer;

    private Instant createdAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
    }
}
