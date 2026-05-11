package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;
import com.project.AIH.utils.JsonStringListConverter;
import java.util.List;

@Entity
@Table(
    name = "scan_sub_scores",
    indexes = {
        @Index(name = "idx_sub_scores_scan_id", columnList = "scan_id"),
        @Index(name = "idx_sub_scores_sec_key", columnList = "section_key")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanSubScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_id", nullable = false)
    @ToString.Exclude
    private ResumeScan scan;

    @Column(name = "section_key", length = 50, nullable = false)
    private String sectionKey;

    private Integer score;

    @Column(name = "max_score")
    private Integer maxScore;

    @Column(name = "lost_points")
    private Integer lostPoints;

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> details;

    @Column(columnDefinition = "TEXT")
    private String tip;

    // Audit fields
    private java.time.Instant createdAt;
    private java.time.Instant updatedAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = java.time.Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = java.time.Instant.now();
    }
}
