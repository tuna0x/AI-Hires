package com.project.AIH.repositories;

import com.project.AIH.models.ScoreDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoreDetailRepository extends JpaRepository<ScoreDetail, Long> {
}
