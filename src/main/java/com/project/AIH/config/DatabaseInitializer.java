package com.project.AIH.config;

import com.project.AIH.models.Permission;
import com.project.AIH.models.Role;
import com.project.AIH.repositories.PermissionRepository;
import com.project.AIH.repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
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

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info(">>> START INIT DATABASE");

        // 1. Ensure Roles exist
        Role adminRole = this.roleRepository.findByName("ADMIN").orElse(null);
        if (adminRole == null) {
            adminRole = new Role();
            adminRole.setName("ADMIN");
            adminRole.setDescription("Full control role");
            adminRole.setActive(true);
            adminRole = this.roleRepository.save(adminRole);
        }

        Role hrRole = this.roleRepository.findByName("HR").orElse(null);
        if (hrRole == null) {
            hrRole = new Role();
            hrRole.setName("HR");
            hrRole.setDescription("Human Resources role");
            hrRole.setActive(true);
            hrRole = this.roleRepository.save(hrRole);
        }

        Role candidateRole = this.roleRepository.findByName("CANDIDATE").orElse(null);
        if (candidateRole == null) {
            candidateRole = new Role();
            candidateRole.setName("CANDIDATE");
            candidateRole.setDescription("Job candidate role");
            candidateRole.setActive(true);
            candidateRole = this.roleRepository.save(candidateRole);
        }

        // 2. Sync Permissions
        syncPermissions(adminRole, hrRole, candidateRole);

        log.info(">>> FINISH INIT DATABASE");
    }

    private void syncPermissions(Role adminRole, Role hrRole, Role candidateRole) {
        List<PermDef> perms = new ArrayList<>();

        // JOBS
        perms.add(new PermDef("Create Job", "/api/v1/jobs", "POST", "JOBS", true, false));
        perms.add(new PermDef("Update Job", "/api/v1/jobs/**", "PUT", "JOBS", true, false));
        perms.add(new PermDef("Delete Job", "/api/v1/jobs/**", "DELETE", "JOBS", true, false));
        perms.add(new PermDef("Get Jobs", "/api/v1/jobs", "GET", "JOBS", true, true));

        // RESUMES
        perms.add(new PermDef("Upload Resume", "/api/v1/resumes/upload", "POST", "RESUMES", true, true));
        perms.add(new PermDef("Get Resumes", "/api/v1/resumes", "GET", "RESUMES", true, false));

        // APPLICATIONS
        perms.add(new PermDef("Apply for Job", "/api/v1/applications", "POST", "APPLICATIONS", false, true));
        perms.add(new PermDef("Get Applications", "/api/v1/applications", "GET", "APPLICATIONS", true, true));

        for (PermDef def : perms) {
            Permission p = this.permissionRepository.findByModuleAndApiPathAndMethod(def.module, def.path, def.method);
            if (p == null) {
                p = new Permission(def.name, def.path, def.method, def.module);
                p = this.permissionRepository.save(p);
            }

            // Assign to Admin
            if (adminRole.getPermissions() == null) adminRole.setPermissions(new ArrayList<>());
            Permission finalP = p;
            if (adminRole.getPermissions().stream().noneMatch(x -> x.getId().equals(finalP.getId()))) {
                adminRole.getPermissions().add(p);
            }

            // Assign to HR
            if (def.toHr) {
                if (hrRole.getPermissions() == null) hrRole.setPermissions(new ArrayList<>());
                if (hrRole.getPermissions().stream().noneMatch(x -> x.getId().equals(finalP.getId()))) {
                    hrRole.getPermissions().add(p);
                }
            }

            // Assign to Candidate
            if (def.toCandidate) {
                if (candidateRole.getPermissions() == null) candidateRole.setPermissions(new ArrayList<>());
                if (candidateRole.getPermissions().stream().noneMatch(x -> x.getId().equals(finalP.getId()))) {
                    candidateRole.getPermissions().add(p);
                }
            }
        }

        this.roleRepository.save(adminRole);
        this.roleRepository.save(hrRole);
        this.roleRepository.save(candidateRole);
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
