package com.project.AIH.models;

import com.project.AIH.utils.constant.InterviewSessionStatusEnum;
import com.project.AIH.utils.constant.InterviewTypeEnum;
import com.project.AIH.utils.constant.DifficultyLevelEnum;
import com.project.AIH.utils.constant.InterviewSessionTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import com.project.AIH.utils.SecurityUtil;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "interview_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ToString.Exclude
    private Application application;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InterviewSessionTypeEnum sessionType = InterviewSessionTypeEnum.REAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mock_resume_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ToString.Exclude
    private Resume mockResume;

    @Column(name = "source_resume_scan_id")
    private Long sourceResumeScanId;

    private String mockJobTitle;

    @Column(columnDefinition = "TEXT")
    private String mockJdContent;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InterviewSessionStatusEnum status = InterviewSessionStatusEnum.IN_PROGRESS;

    @Enumerated(EnumType.STRING)
    private InterviewTypeEnum interviewType;

    @Enumerated(EnumType.STRING)
    private DifficultyLevelEnum difficultyLevel;

    private Integer totalQuestions;
    private Integer maxQuestions;

    @OneToMany(mappedBy = "interviewSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InterviewQuestion> questions;

    @OneToOne(mappedBy = "interviewSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private InterviewReport interviewReport;

    @Column(columnDefinition = "TEXT")
    private String runningSummary;

    // Audit fields
    private Instant startTime;
    private Instant endTime;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    @com.fasterxml.jackson.annotation.JsonProperty("jobTitle")
    public String getJobTitle() {
        if (this.sessionType == InterviewSessionTypeEnum.MOCK) {
            return this.mockJobTitle != null ? this.mockJobTitle : "Luyện tập phỏng vấn";
        }
        try {
            if (this.application != null && this.application.getJob() != null) {
                return this.application.getJob().getTitle();
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return "Luyện tập phỏng vấn";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("jobDescription")
    public String getJobDescription() {
        if (this.sessionType == InterviewSessionTypeEnum.MOCK) {
            return this.mockJdContent;
        }
        try {
            if (this.application != null && this.application.getJob() != null) {
                return this.application.getJob().getDescription();
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("resumeId")
    public Long getResumeId() {
        if (this.sessionType == InterviewSessionTypeEnum.MOCK) {
            return this.mockResume != null ? this.mockResume.getId() : null;
        }
        try {
            if (this.application != null && this.application.getResume() != null) {
                return this.application.getResume().getId();
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("scanId")
    public Long getScanId() {
        return this.sourceResumeScanId;
    }

    @PrePersist
    public void handleBeforeCreate() {
        this.createdBy = SecurityUtil.getCurrentUserLogin().orElse("SYSTEM");
        this.createdAt = Instant.now();
        if (this.startTime == null) {
            this.startTime = Instant.now();
        }
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedBy = SecurityUtil.getCurrentUserLogin().orElse("SYSTEM");
        this.updatedAt = Instant.now();
    }
}
