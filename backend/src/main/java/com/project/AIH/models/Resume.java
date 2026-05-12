package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.ResumeStatusEnum;
import com.project.AIH.utils.constant.CandidateLevelEnum;
import com.project.AIH.utils.PiiEncryptionConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import com.project.AIH.utils.SecurityUtil;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "resumes", indexes = {
    @Index(name = "idx_resume_dedup", columnList = "user_id, content_hash", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    @ToString.Exclude
    @JsonIgnore
    private User user;

    @NotBlank(message = "File URL is required")
    private String fileUrl;
    
    private String contentType;
    private long fileSize;

    @Column(columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ResumeStatusEnum parseStatus = ResumeStatusEnum.PENDING;

    @OneToOne(mappedBy = "resume", cascade = CascadeType.ALL)
    private ResumeRawAiOutput rawAiOutput;

    // --- Merged Basic Info fields ---
    private String fullName;

    @Convert(converter = PiiEncryptionConverter.class)
    private String email;

    @Column(name = "email_hash", length = 64)
    private String emailHash;

    @Convert(converter = PiiEncryptionConverter.class)
    private String phone;

    @Convert(converter = PiiEncryptionConverter.class)
    private String address;

    private LocalDate dateOfBirth;

    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;

    @Column(columnDefinition = "TEXT")
    private String objective;

    @Enumerated(EnumType.STRING)
    private CandidateLevelEnum predictedLevel;

    private String predictedIndustry;

    // --- Virtual Backwards Compatible Getters ---
    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("basicInfo")
    public ResumeBasicInfo getBasicInfo() {
        return ResumeBasicInfo.builder()
                .fullName(this.fullName)
                .email(this.email)
                .emailHash(this.emailHash)
                .phone(this.phone)
                .address(this.address)
                .dateOfBirth(this.dateOfBirth)
                .linkedinUrl(this.linkedinUrl)
                .githubUrl(this.githubUrl)
                .portfolioUrl(this.portfolioUrl)
                .objective(this.objective)
                .predictedLevel(this.predictedLevel)
                .predictedIndustry(this.predictedIndustry)
                .build();
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("parsedData")
    public String getParsedData() {
        return (this.rawAiOutput != null) ? this.rawAiOutput.getAtsJson() : null;
    }

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeSkill> skills;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeExperience> experiences;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeEducation> educations;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeCertification> certifications;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeProject> projects;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeLanguage> languages;

    // Audit fields
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdBy = SecurityUtil.getCurrentUserLogin().orElse("SYSTEM");
        this.createdAt = Instant.now();
        this.emailHash = hashEmail(this.email);
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedBy = SecurityUtil.getCurrentUserLogin().orElse("SYSTEM");
        this.updatedAt = Instant.now();
        this.emailHash = hashEmail(this.email);
    }

    private String hashEmail(String emailVal) {
        if (emailVal == null) {
            return null;
        }
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(emailVal.trim().toLowerCase().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
