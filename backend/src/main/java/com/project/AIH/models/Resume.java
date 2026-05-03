package com.project.AIH.models;

import com.project.AIH.utils.constant.ResumeStatusEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import com.project.AIH.utils.SecurityUtil;
import java.time.Instant;

@Entity
@Table(name = "resumes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @NotBlank(message = "File URL is required")
    private String fileUrl;
    
    private String contentType;
    private long fileSize;

    @Column(columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(columnDefinition = "LONGTEXT")
    private String parsedData; // JSON format

    @Enumerated(EnumType.STRING)
    private ResumeStatusEnum parseStatus = ResumeStatusEnum.PENDING;

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
