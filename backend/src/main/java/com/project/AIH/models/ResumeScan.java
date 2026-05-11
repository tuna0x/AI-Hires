package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;
import com.project.AIH.utils.JsonStringListConverter;
import java.time.Instant;
import java.util.List;

@Entity
@Table(
    name = "resume_scans",
    indexes = {
        @Index(name = "idx_scans_file_hash", columnList = "file_hash"),
        @Index(name = "idx_scans_scanned_at", columnList = "scanned_at"),
        @Index(name = "idx_scans_level", columnList = "level")
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

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    @Column(name = "candidate_name")
    private String candidateName;

    private String level;
    private String industry;

    @Column(name = "scanned_at")
    private Instant scannedAt;

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
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = Instant.now();
    }
}
