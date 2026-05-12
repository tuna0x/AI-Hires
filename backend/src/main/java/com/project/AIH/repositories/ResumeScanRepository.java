package com.project.AIH.repositories;

import com.project.AIH.models.ResumeScan;
import com.project.AIH.utils.constant.ResumeScanStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeScanRepository extends JpaRepository<ResumeScan, Long> {
    Optional<ResumeScan> findByFileHash(String fileHash);
    List<ResumeScan> findByFileHashAndStatusOrderByCreatedAtDesc(String fileHash, ResumeScanStatusEnum status);

    @Modifying
    @Transactional
    @Query("""
            update ResumeScan scan
               set scan.status = :nextStatus,
                   scan.failureCode = null,
                   scan.failureMessage = null,
                   scan.attemptCount = coalesce(scan.attemptCount, 0) + 1
             where scan.id = :scanId
               and scan.status in :allowedStatuses
            """)
    int claimForProcessing(@Param("scanId") Long scanId,
                           @Param("nextStatus") ResumeScanStatusEnum nextStatus,
                           @Param("allowedStatuses") List<ResumeScanStatusEnum> allowedStatuses);
}
