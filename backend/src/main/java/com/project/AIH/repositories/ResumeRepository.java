package com.project.AIH.repositories;

import com.project.AIH.models.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long>, JpaSpecificationExecutor<Resume> {
    List<Resume> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Resume> findByFileUrl(String fileUrl);
    Optional<Resume> findByUserIdAndContentHash(Long userId, String contentHash);
}
