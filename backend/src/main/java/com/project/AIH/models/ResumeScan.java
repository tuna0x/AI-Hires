package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;
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

    @OneToOne(mappedBy = "scan", cascade = CascadeType.ALL, orphanRemoval = true)
    private ScanScore scoreSummary;

    @OneToMany(mappedBy = "scan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScanSubScore> subScores;

    @OneToMany(mappedBy = "scan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScanAction> actions;

    @PrePersist
    public void handleBeforeCreate() {
        if (this.scannedAt == null) {
            this.scannedAt = Instant.now();
        }
    }
}
