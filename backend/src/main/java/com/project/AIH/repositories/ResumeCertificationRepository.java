package com.project.AIH.repositories;

import com.project.AIH.models.ResumeCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResumeCertificationRepository extends JpaRepository<ResumeCertification, Long> {
}
