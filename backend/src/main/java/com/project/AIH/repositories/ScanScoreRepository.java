package com.project.AIH.repositories;

import com.project.AIH.models.ScanScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScanScoreRepository extends JpaRepository<ScanScore, Long> {
}
