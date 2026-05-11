package com.project.AIH.repositories;

import com.project.AIH.models.ResumeRawAiOutput;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeRawAiOutputRepository extends JpaRepository<ResumeRawAiOutput, Long> {
    Optional<ResumeRawAiOutput> findByResumeId(Long resumeId);
}
