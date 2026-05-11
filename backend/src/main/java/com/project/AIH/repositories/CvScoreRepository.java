package com.project.AIH.repositories;

import com.project.AIH.models.CvScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CvScoreRepository extends JpaRepository<CvScore, Long> {
    java.util.Optional<CvScore> findByApplicationId(Long applicationId);
}
