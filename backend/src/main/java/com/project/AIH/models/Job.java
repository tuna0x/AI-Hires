package com.project.AIH.models;

import com.project.AIH.utils.constant.JobLevelEnum;
import com.project.AIH.utils.constant.JobTypeEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import com.project.AIH.utils.SecurityUtil;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    @Column(columnDefinition = "TEXT")
    @NotBlank(message = "Description is required")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @NotBlank(message = "Location is required")
    private String location;

    @DecimalMin(value = "0.0", message = "Salary must be positive")
    private double salary;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    @Enumerated(EnumType.STRING)
    private JobLevelEnum level;

    @Enumerated(EnumType.STRING)
    private JobTypeEnum type;
    
    @Column(columnDefinition = "TEXT")
    private String aiSuggestedKeywords;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "job_skill", 
               joinColumns = @JoinColumn(name = "job_id"), 
               inverseJoinColumns = @JoinColumn(name = "skill_id"))
    private List<Skill> skills;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    private boolean active = true;
    private Instant startDate;
    private Instant endDate;

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
