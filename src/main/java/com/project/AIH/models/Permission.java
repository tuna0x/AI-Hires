package com.project.AIH.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import com.project.AIH.utils.SecurityUtil;
import java.time.Instant;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "permissions", indexes = {
    @Index(name = "idx_perm_name", columnList = "name"),
    @Index(name = "idx_perm_path_method", columnList = "apiPath, method")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "API Path is required")
    private String apiPath;

    @NotBlank(message = "Method is required")
    private String method;

    private String module;

    // Audit fields
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    @ManyToMany(mappedBy = "permissions", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Role> roles;

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
