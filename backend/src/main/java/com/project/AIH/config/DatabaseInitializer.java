package com.project.AIH.config;

import com.project.AIH.models.Permission;
import com.project.AIH.models.Role;
import com.project.AIH.models.User;
import com.project.AIH.repositories.PermissionRepository;
import com.project.AIH.repositories.RoleRepository;
import com.project.AIH.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info(">>> START INIT DATABASE");

        // 1. Ensure Roles exist
        Role adminRole = this.roleRepository.findByName("ADMIN").orElseGet(() -> {
            Role r = Role.builder().name("ADMIN").description("Full control role").active(true).build();
            return this.roleRepository.save(r);
        });

        Role hrRole = this.roleRepository.findByName("HR").orElseGet(() -> {
            Role r = Role.builder().name("HR").description("Human Resources role").active(true).build();
            return this.roleRepository.save(r);
        });

        Role candidateRole = this.roleRepository.findByName("CANDIDATE").orElseGet(() -> {
            Role r = Role.builder().name("CANDIDATE").description("Job candidate role").active(true).build();
            return this.roleRepository.save(r);
        });

        // 2. Sync Permissions
        syncPermissions(adminRole, hrRole, candidateRole);

        log.info(">>> FINISH INIT DATABASE");
    }

    private void syncPermissions(Role adminRole, Role hrRole, Role candidateRole) {
        List<PermDef> perms = new ArrayList<>();

        // USERS
        perms.add(new PermDef("Create User", "/api/v1/users", "POST", "USERS", false, false));
        perms.add(new PermDef("Update User", "/api/v1/users/**", "PUT", "USERS", false, false));
        perms.add(new PermDef("Delete User", "/api/v1/users/**", "DELETE", "USERS", false, false));
        perms.add(new PermDef("Get Users", "/api/v1/users", "GET", "USERS", false, false));
        perms.add(new PermDef("Get User by Id", "/api/v1/users/{id}", "GET", "USERS", true, true));
        perms.add(new PermDef("Update User Info", "/api/v1/users", "PUT", "USERS", true, true));

        // COMPANIES
        perms.add(new PermDef("Create Company", "/api/v1/companies", "POST", "COMPANIES", true, false));
        perms.add(new PermDef("Update Company", "/api/v1/companies/**", "PUT", "COMPANIES", true, false));
        perms.add(new PermDef("Delete Company", "/api/v1/companies/**", "DELETE", "COMPANIES", false, false));
        perms.add(new PermDef("Get Companies", "/api/v1/companies", "GET", "COMPANIES", true, true));

        // JOBS
        perms.add(new PermDef("Create Job", "/api/v1/jobs", "POST", "JOBS", true, false));
        perms.add(new PermDef("Update Job", "/api/v1/jobs/**", "PUT", "JOBS", true, false));
        perms.add(new PermDef("Delete Job", "/api/v1/jobs/**", "DELETE", "JOBS", true, false));
        perms.add(new PermDef("Get Jobs", "/api/v1/jobs", "GET", "JOBS", true, true));

        // SKILLS
        perms.add(new PermDef("Create Skill", "/api/v1/skills", "POST", "SKILLS", true, false));
        perms.add(new PermDef("Get Skills", "/api/v1/skills", "GET", "SKILLS", true, true));

        // RESUMES
        perms.add(new PermDef("Upload Resume", "/api/v1/resumes/upload", "POST", "RESUMES", true, true));
        perms.add(new PermDef("Get Resumes", "/api/v1/resumes", "GET", "RESUMES", true, false));
        perms.add(new PermDef("Get My Resumes", "/api/v1/resumes/my-resumes", "GET", "RESUMES", true, true));

        // APPLICATIONS
        perms.add(new PermDef("Apply for Job", "/api/v1/resumes/apply", "POST", "APPLICATIONS", false, true));
        perms.add(new PermDef("Get Applications", "/api/v1/applications", "GET", "APPLICATIONS", true, true));

        // AI SCORES
        perms.add(new PermDef("Get AI Score", "/api/v1/ai-scores/**", "GET", "AI_SCORES", true, true));

        // INTERVIEWS
        perms.add(new PermDef("Start Interview", "/api/v1/interviews/start", "POST", "INTERVIEWS", true, true));
        perms.add(new PermDef("Start Mock Interview", "/api/v1/interviews/start-mock", "POST", "INTERVIEWS", true, true));
        perms.add(new PermDef("Get Interview Session", "/api/v1/interviews/{sessionId}", "GET", "INTERVIEWS", true, true));
        perms.add(new PermDef("Submit Interview Answer", "/api/v1/interviews/{sessionId}/answer", "POST", "INTERVIEWS", true, true));
        perms.add(new PermDef("Finish Interview Session", "/api/v1/interviews/{sessionId}/finish", "POST", "INTERVIEWS", true, true));
        perms.add(new PermDef("Get Interview Questions", "/api/v1/interviews/{sessionId}/questions", "GET", "INTERVIEWS", true, true));
        perms.add(new PermDef("Get Interview Report", "/api/v1/interviews/{sessionId}/report", "GET", "INTERVIEWS", true, true));
        perms.add(new PermDef("Get My Interview Sessions", "/api/v1/interviews/my-sessions", "GET", "INTERVIEWS", true, true));

        for (PermDef def : perms) {
            Permission p = this.permissionRepository.findByModuleAndApiPathAndMethod(def.module, def.path, def.method);
            if (p == null) {
                p = Permission.builder()
                        .name(def.name)
                        .apiPath(def.path)
                        .method(def.method)
                        .module(def.module)
                        .build();
                p = this.permissionRepository.save(p);
            }

            // Assign to Admin
            if (adminRole.getPermissions() == null)
                adminRole.setPermissions(new ArrayList<>());
            Permission finalP = p;
            if (adminRole.getPermissions().stream().noneMatch(x -> x.getId().equals(finalP.getId()))) {
                adminRole.getPermissions().add(p);
            }

            // Assign to HR
            if (def.toHr) {
                if (hrRole.getPermissions() == null)
                    hrRole.setPermissions(new ArrayList<>());
                if (hrRole.getPermissions().stream().noneMatch(x -> x.getId().equals(finalP.getId()))) {
                    hrRole.getPermissions().add(p);
                }
            }

            // Assign to Candidate
            if (def.toCandidate) {
                if (candidateRole.getPermissions() == null)
                    candidateRole.setPermissions(new ArrayList<>());
                if (candidateRole.getPermissions().stream().noneMatch(x -> x.getId().equals(finalP.getId()))) {
                    candidateRole.getPermissions().add(p);
                }
            }
        }

        this.roleRepository.save(adminRole);
        this.roleRepository.save(hrRole);
        this.roleRepository.save(candidateRole);

        // 3. Initialize Admin User
        createAdminUserIfNotFound(adminRole);
    }

    private void createAdminUserIfNotFound(Role adminRole) {
        String adminEmail = "admin@gmail.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode("123456"))
                    .role(adminRole)
                    .active(true)
                    .verified(true)
                    .build();
            userRepository.save(admin);
        }
    }

    private static class PermDef {
        String name;
        String path;
        String method;
        String module;
        boolean toHr;
        boolean toCandidate;

        PermDef(String name, String path, String method, String module, boolean toHr, boolean toCandidate) {
            this.name = name;
            this.path = path;
            this.method = method;
            this.module = module;
            this.toHr = toHr;
            this.toCandidate = toCandidate;
        }
    }
}
