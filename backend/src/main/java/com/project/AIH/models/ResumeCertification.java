package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "resume_certifications", indexes = {
    @Index(name = "idx_resume_certs_resume_id", columnList = "resume_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Resume resume;

    private String name;
    private String issuingOrganization;

    private LocalDate issueDate;
    private LocalDate expiryDate;

    private String credentialUrl;

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = Instant.now();
    }
}
