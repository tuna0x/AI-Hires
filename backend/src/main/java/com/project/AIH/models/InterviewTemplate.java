package com.project.AIH.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "interview_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private User user;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String role;

    @Column(name = "template_name", nullable = false)
    private String templateName;

    @Column(name = "question_bank_ids", columnDefinition = "TEXT")
    private String questionBankIds; // JSON Array of Longs, e.g., "[1, 2, 3]"

    private Instant createdAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
    }
}
