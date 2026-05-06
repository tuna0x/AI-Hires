package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.ProficiencyLevelEnum;
import com.project.AIH.utils.constant.SkillCategoryEnum;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "resume_skills", indexes = {
    @Index(name = "idx_resume_skills_resume_id", columnList = "resume_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Resume resume;

    @Column(nullable = false)
    private String skillName;

    @Enumerated(EnumType.STRING)
    private SkillCategoryEnum category;

    @Enumerated(EnumType.STRING)
    private ProficiencyLevelEnum proficiencyLevel;

    @Column(precision = 4, scale = 1)
    private BigDecimal yearsOfExperience;

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
