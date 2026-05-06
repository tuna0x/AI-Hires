package com.project.AIH.repositories;

import com.project.AIH.models.CvScoreInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CvScoreInsightRepository extends JpaRepository<CvScoreInsight, Long> {
}
