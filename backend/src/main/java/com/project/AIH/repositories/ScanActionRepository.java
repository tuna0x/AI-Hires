package com.project.AIH.repositories;

import com.project.AIH.models.ScanAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScanActionRepository extends JpaRepository<ScanAction, Long> {
    List<ScanAction> findByScanId(Long scanId);
}
