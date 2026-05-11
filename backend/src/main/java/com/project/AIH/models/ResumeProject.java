package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "resume_projects", indexes = {
    @Index(name = "idx_resume_projects_resume_id", columnList = "resume_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Resume resume;

    private String name;
    private String role;
    
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "resume_project_technologies", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "technology")
    private List<String> technologies;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String url;

    private LocalDate startDate;
    private LocalDate endDate;

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
