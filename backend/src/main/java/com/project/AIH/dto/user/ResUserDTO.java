package com.project.AIH.dto.user;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ResUserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatar;
    private boolean active;
    private boolean verified;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private RoleUser role;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleUser {
        private Long id;
        private String name;
    }
}
