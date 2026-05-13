package com.project.AIH.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.ResumeScanMessage;
import com.project.AIH.dto.ResumeScanResultDTO;
import com.project.AIH.models.ResumeScan;
import com.project.AIH.models.User;
import com.project.AIH.repositories.ResumeScanRepository;
import com.project.AIH.utils.constant.ResumeScanStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeScanService {
    private static final long MAX_SCAN_FILE_SIZE_BYTES = 10L * 1024 * 1024;

    private final ResumeScanRepository resumeScanRepository;
    private final FileService fileService;
    private final ReliableMessagePublisher reliableMessagePublisher;
    private final ScanMapperService scanMapperService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ResumeScanResultDTO createScan(MultipartFile file, User user) {
        validateFile(file);

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong the doc noi dung tep.");
        }

        String fileHash = calculateHash(fileBytes);
        ResumeScan reusableScan = findReusableScan(user, fileHash);
        if (reusableScan != null) {
            return toResultDTO(reusableScan);
        }

        String folderPath = (user != null) ? "resume-scans/" + user.getId() : "resume-scans/guest";
        String storageObjectKey;
        try {
            storageObjectKey = fileService.uploadFile(file, folderPath);
        } catch (Exception e) {
            log.error("Failed to upload scan file", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the tai tep len he thong luu tru.");
        }

        try {
            ResumeScan scan = ResumeScan.builder()
                    .user(user)
                    .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : storageObjectKey)
                    .storageObjectKey(storageObjectKey)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .fileHash(fileHash)
                    .status(ResumeScanStatusEnum.PENDING)
                    .scannedAt(Instant.now())
                    .build();
            scan = resumeScanRepository.save(scan);

            reliableMessagePublisher.publish(
                    RabbitMQConfig.CV_PARSING_EXCHANGE,
                    RabbitMQConfig.CV_PARSING_ROUTING_KEY,
                    ResumeScanMessage.builder()
                            .scanId(scan.getId())
                            .storageObjectKey(storageObjectKey)
                            .contentType(file.getContentType())
                            .fileHash(fileHash)
                            .build()
            );

            return toResultDTO(scan);
        } catch (Exception e) {
            fileService.deleteFile(storageObjectKey);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public ResumeScanResultDTO getScanResult(Long scanId, User user) {
        ResumeScan scan = getAuthorizedScan(scanId, user);
        return toResultDTO(scan);
    }

    @Transactional
    public void submitFeedback(Long scanId, Integer rating, String feedback, User user) {
        ResumeScan scan = getAuthorizedScan(scanId, user);
        scan.setUserRating(rating);
        scan.setUserFeedback(feedback);
        resumeScanRepository.save(scan);
    }

    @Transactional(readOnly = true)
    public ResumeScan getAuthorizedScan(Long scanId, User user) {
        ResumeScan scan = resumeScanRepository.findById(scanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ket qua quet CV"));
        if (scan.getUser() != null) {
            if (user == null || !scan.getUser().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ban khong co quyen truy cap ket qua nay");
            }
        }
        return scan;
    }

    @Transactional(readOnly = true)
    public ResumeScanResultDTO toResultDTO(ResumeScan scan) {
        Map<String, Object> rawGeminiData = null;
        if (scan.getRawAiOutput() != null && scan.getRawAiOutput().getAtsJson() != null && !scan.getRawAiOutput().getAtsJson().isBlank()) {
            try {
                rawGeminiData = objectMapper.readValue(scan.getRawAiOutput().getAtsJson(), new TypeReference<>() {});
            } catch (Exception e) {
                log.warn("Failed to parse raw ATS JSON for scan {}", scan.getId(), e);
            }
        }

        List<ResumeScanResultDTO.PriorityActionDTO> priorityActions = new ArrayList<>();
        if (scan.getActions() != null) {
            priorityActions = scan.getActions().stream()
                    .sorted(Comparator.comparing(a -> a.getSortOrder() == null ? Integer.MAX_VALUE : a.getSortOrder()))
                    .map(action -> ResumeScanResultDTO.PriorityActionDTO.builder()
                            .action(action.getAction())
                            .priority(action.getPriority() != null ? action.getPriority().name() : "MEDIUM")
                            .build())
                    .collect(Collectors.toList());
        }

        List<ResumeScanResultDTO.SubScoreDTO> subScores = new ArrayList<>();
        if (scan.getSubScores() != null) {
            subScores = scan.getSubScores().stream()
                    .map(sub -> ResumeScanResultDTO.SubScoreDTO.builder()
                            .sectionKey(sub.getSectionKey())
                            .score(sub.getScore())
                            .maxScore(sub.getMaxScore())
                            .lostPoints(sub.getLostPoints())
                            .details(sub.getDetails())
                            .tip(sub.getTip())
                            .build())
                    .collect(Collectors.toList());
        }

        List<ResumeScanResultDTO.ScoreGapDTO> scoreGaps = new ArrayList<>();
        if (scan.getSubScores() != null) {
            scoreGaps = scan.getSubScores().stream()
                    .filter(sub -> sub.getLostPoints() != null && sub.getLostPoints() > 0)
                    .sorted((a, b) -> Integer.compare(b.getLostPoints(), a.getLostPoints()))
                    .limit(5)
                    .map(sub -> ResumeScanResultDTO.ScoreGapDTO.builder()
                            .section(scanMapperService.getHumanReadableSectionName(sub.getSectionKey()))
                            .current(sub.getScore())
                            .max(sub.getMaxScore())
                            .lost(sub.getLostPoints())
                            .tip(sub.getTip())
                            .build())
                    .collect(Collectors.toList());
        }

        return ResumeScanResultDTO.builder()
                .id(scan.getId())
                .status(scan.getStatus())
                .fileName(scan.getFileName())
                .createdAt(scan.getCreatedAt())
                .completedAt(scan.getCompletedAt())
                .candidateName(scan.getCandidateName())
                .level(scan.getLevel())
                .industry(scan.getIndustry())
                .totalScore(scan.getTotalScore())
                .stage2Score(scan.getStage2Score())
                .stage3Score(scan.getStage3Score())
                .stage4Score(scan.getStage4Score())
                .strengths(scan.getStrengths())
                .priorityActions(priorityActions)
                .scoreGaps(scoreGaps)
                .subScores(subScores)
                .failureCode(scan.getFailureCode())
                .failureMessage(scan.getFailureMessage())
                .rawGeminiData(rawGeminiData)
                .build();
    }

    private ResumeScan findReusableScan(User user, String fileHash) {
        if (user == null) {
            return null;
        }
        return resumeScanRepository.findByFileHashAndStatusOrderByCreatedAtDesc(fileHash, ResumeScanStatusEnum.COMPLETED)
                .stream()
                .filter(scan -> scan.getUser() != null && user.getId().equals(scan.getUser().getId()))
                .findFirst()
                .orElse(null);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File khong co noi dung.");
        }
        if (file.getSize() > MAX_SCAN_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File qua lon. Toi da 10MB.");
        }
        try {
            Tika tika = new Tika();
            String detectedMime = tika.detect(file.getInputStream());
            if (!detectedMime.equals("application/pdf")
                    && !detectedMime.equals("application/msword")
                    && !detectedMime.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi chap nhan file PDF hoac Word.");
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong the doc dinh dang file.");
        }
    }

    private String calculateHash(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return java.util.UUID.randomUUID().toString().replace("-", "");
        }
    }
}
