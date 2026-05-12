package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "resume_scan_raw_ai_output")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeScanRawAiOutput {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_scan_id", nullable = false, unique = true)
    @ToString.Exclude
    @JsonIgnore
    private ResumeScan resumeScan;

    @Column(columnDefinition = "LONGTEXT")
    private String atsJson;

    @Column(columnDefinition = "LONGTEXT")
    private String rawAiJson;

    @Column(columnDefinition = "LONGTEXT")
    private String profileJson;

    @Column(length = 100)
    private String aiModel;

    @Column(length = 20)
    private String promptVersion;

    @Column(length = 128)
    private String promptHash;

    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
