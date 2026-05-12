package com.project.AIH.repositories;

import com.project.AIH.models.ResumeScanRawAiOutput;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResumeScanRawAiOutputRepository extends JpaRepository<ResumeScanRawAiOutput, Long> {
    Optional<ResumeScanRawAiOutput> findByResumeScanId(Long resumeScanId);
}
