package com.project.AIH.services;

import com.project.AIH.models.ResumeScan;
import com.project.AIH.repositories.ResumeScanRepository;
import com.project.AIH.utils.constant.ResumeScanStatusEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResumeScanStateService {

    private final ResumeScanRepository resumeScanRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResumeScan claimForProcessing(Long scanId) {
        int updated = resumeScanRepository.claimForProcessing(
                scanId,
                ResumeScanStatusEnum.EXTRACTING,
                List.of(ResumeScanStatusEnum.PENDING, ResumeScanStatusEnum.FAILED)
        );
        if (updated == 0) {
            return null;
        }
        return resumeScanRepository.findById(scanId).orElse(null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResumeScan markAnalyzing(Long scanId, String extractedText, String contentHash) {
        ResumeScan scan = resumeScanRepository.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Resume scan not found: " + scanId));
        scan.setExtractedText(extractedText);
        scan.setContentHash(contentHash);
        scan.setStatus(ResumeScanStatusEnum.ANALYZING);
        return resumeScanRepository.save(scan);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResumeScan markCompleted(Long scanId) {
        ResumeScan scan = resumeScanRepository.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Resume scan not found: " + scanId));
        scan.setStatus(ResumeScanStatusEnum.COMPLETED);
        scan.setCompletedAt(Instant.now());
        return resumeScanRepository.save(scan);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long scanId, String failureCode, String failureMessage) {
        ResumeScan scan = resumeScanRepository.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Resume scan not found: " + scanId));
        scan.setStatus(ResumeScanStatusEnum.FAILED);
        scan.setFailureCode(failureCode);
        scan.setFailureMessage(failureMessage);
        resumeScanRepository.save(scan);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetToPending(Long scanId) {
        ResumeScan scan = resumeScanRepository.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Resume scan not found: " + scanId));
        scan.setStatus(ResumeScanStatusEnum.PENDING);
        scan.setFailureCode(null);
        scan.setFailureMessage(null);
        resumeScanRepository.save(scan);
    }
}
