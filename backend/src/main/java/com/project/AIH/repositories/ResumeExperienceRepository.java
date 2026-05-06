package com.project.AIH.repositories;

import com.project.AIH.models.ResumeExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResumeExperienceRepository extends JpaRepository<ResumeExperience, Long> {
}
