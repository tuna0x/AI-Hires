package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.AIH.utils.constant.CandidateLevelEnum;
import com.project.AIH.utils.PiiEncryptionConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.Instant;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Entity
@Table(
    name = "resume_basic_info",
    indexes = {
        @Index(name = "idx_resume_basic_info_email_hash", columnList = "emailHash")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeBasicInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false, unique = true)
    @JsonIgnore
    @ToString.Exclude
    private Resume resume;

    private String fullName;

    @Convert(converter = PiiEncryptionConverter.class)
    private String email;

    @Column(length = 64)
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

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
        this.emailHash = hashEmail(this.email);
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = Instant.now();
        this.emailHash = hashEmail(this.email);
    }

    private String hashEmail(String emailVal) {
        if (emailVal == null) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(emailVal.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
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
