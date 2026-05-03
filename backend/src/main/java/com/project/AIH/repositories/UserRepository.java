package com.project.AIH.repositories;

import com.project.AIH.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    Optional<User> findByRefreshTokenAndEmail(String refreshToken, String email);
    boolean existsByEmail(String email);
}
