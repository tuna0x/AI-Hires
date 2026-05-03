package com.project.AIH.repositories;

import com.project.AIH.models.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Permission findByModuleAndApiPathAndMethod(String module, String apiPath, String method);
}
