package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;
import com.project.AIH.utils.JsonStringListConverter;
import java.time.Instant;
import java.util.List;
import com.project.AIH.utils.constant.ResumeScanStatusEnum;

@Entity
@Table(
    name = "resume_scans",
    indexes = {
        @Index(name = "idx_scans_file_hash", columnList = "file_hash"),
        @Index(name = "idx_scans_scanned_at", columnList = "scanned_at"),
        @Index(name = "idx_scans_level", columnList = "level"),
        @Index(name = "idx_scans_status", columnList = "status")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "storage_object_key", nullable = false)
    private String storageObjectKey;

    private String contentType;
    private Long fileSize;

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(name = "candidate_name")
    private String candidateName;

    private String level;
    private String industry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResumeScanStatusEnum status;

    @Column(length = 100)
    private String failureCode;

    @Column(columnDefinition = "TEXT")
    private String failureMessage;

    private Integer attemptCount;

    @Column(name = "scanned_at")
    private Instant scannedAt;

    private Instant completedAt;

    private Integer userRating;
    @Column(columnDefinition = "TEXT")
    private String userFeedback;

    // --- Merged ScanScore fields ---
    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "stage2_score")
    private Integer stage2Score;

    @Column(name = "stage3_score")
    private Integer stage3Score;

    @Column(name = "stage4_score")
    private Integer stage4Score;

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> strengths;

    @OneToOne(mappedBy = "resumeScan", cascade = CascadeType.ALL, orphanRemoval = true)
    private ResumeScanRawAiOutput rawAiOutput;

    // --- Virtual Backwards Compatible Getter ---
    @Transient
    public ScanScore getScoreSummary() {
        return ScanScore.builder()
                .scan(this)
                .totalScore(this.totalScore)
                .stage2Score(this.stage2Score)
                .stage3Score(this.stage3Score)
                .stage4Score(this.stage4Score)
                .strengths(this.strengths)
                .build();
    }

    @OneToMany(mappedBy = "scan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScanSubScore> subScores;

    @OneToMany(mappedBy = "scan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScanAction> actions;

    // Audit timestamps
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void handleBeforeCreate() {
        if (this.scannedAt == null) {
            this.scannedAt = Instant.now();
        }
        if (this.status == null) {
            this.status = ResumeScanStatusEnum.PENDING;
        }
        if (this.attemptCount == null) {
            this.attemptCount = 0;
        }
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = Instant.now();
    }
}
