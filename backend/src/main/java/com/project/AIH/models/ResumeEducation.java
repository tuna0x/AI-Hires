package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "resume_educations", indexes = {
    @Index(name = "idx_resume_educations_resume_id", columnList = "resume_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeEducation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Resume resume;

    private String institutionName;
    private String degree;
    private String fieldOfStudy;

    private LocalDate startDate;
    private LocalDate endDate;

    @Column(precision = 3, scale = 2)
    private BigDecimal gpa;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer displayOrder;

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
