package com.project.AIH.repositories;

import com.project.AIH.models.ResumeScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ResumeScanRepository extends JpaRepository<ResumeScan, Long> {
    Optional<ResumeScan> findByFileHash(String fileHash);
}
