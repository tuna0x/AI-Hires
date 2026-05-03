package com.project.AIH.models;

import com.project.AIH.utils.constant.InterviewMessageRoleEnum;
import jakarta.persistence.*;
import lombok.*;
import com.project.AIH.utils.SecurityUtil;
import java.time.Instant;

@Entity
@Table(name = "interview_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession interviewSession;

    @Enumerated(EnumType.STRING)
    private InterviewMessageRoleEnum role;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private Integer score; // Score for candidate's answer

    @Column(columnDefinition = "TEXT")
    private String feedback; // Feedback from AI for candidate's answer

    // Audit fields
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdBy = SecurityUtil.getCurrentUserLogin().orElse("SYSTEM");
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedBy = SecurityUtil.getCurrentUserLogin().orElse("SYSTEM");
        this.updatedAt = Instant.now();
    }
}
