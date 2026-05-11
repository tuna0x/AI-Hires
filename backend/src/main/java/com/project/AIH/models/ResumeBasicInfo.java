package com.project.AIH.models;

import com.project.AIH.utils.constant.CandidateLevelEnum;
import lombok.*;
import java.time.LocalDate;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeBasicInfo {

    private Long id;
    private String fullName;
    private String email;
    private String emailHash;
    private String phone;
    private String address;
    private LocalDate dateOfBirth;
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String objective;
    private CandidateLevelEnum predictedLevel;
    private String predictedIndustry;
    private Instant createdAt;
    private Instant updatedAt;
}
