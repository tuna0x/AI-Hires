package com.project.AIH.repositories;

import com.project.AIH.models.ScanSubScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScanSubScoreRepository extends JpaRepository<ScanSubScore, Long> {
    List<ScanSubScore> findByScanId(Long scanId);
}
