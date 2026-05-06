package com.project.AIH.repositories;

import com.project.AIH.models.ResumeLanguage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResumeLanguageRepository extends JpaRepository<ResumeLanguage, Long> {
}
