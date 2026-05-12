package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.config.RabbitMQConfig;
import com.project.AIH.dto.ResumeScanMessage;
import com.project.AIH.models.ResumeScan;
import com.project.AIH.models.ResumeScanRawAiOutput;
import com.project.AIH.repositories.ResumeScanRawAiOutputRepository;
import com.project.AIH.repositories.ResumeScanRepository;
import com.project.AIH.utils.constant.ResumeScanStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeScanWorker {

    private final ResumeScanRepository resumeScanRepository;
    private final ResumeScanRawAiOutputRepository rawAiOutputRepository;
    private final FileService fileService;
    private final ResumeParserService resumeParserService;
    private final GeminiService geminiService;
    private final ScanMapperService scanMapperService;
    private final ScoringResultValidator scoringResultValidator;
    private final ResumeScanStateService resumeScanStateService;
    private final ObjectMapper objectMapper;
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final Set<ResumeScanStatusEnum> TERMINAL_OR_ACTIVE_STATUSES = Set.of(
            ResumeScanStatusEnum.EXTRACTING,
            ResumeScanStatusEnum.ANALYZING,
            ResumeScanStatusEnum.COMPLETED
    );

    @RabbitListener(queues = RabbitMQConfig.CV_PARSING_QUEUE)
    public void processScan(org.springframework.amqp.core.Message amqpMessage) {
        ResumeScanMessage message = null;
        ResumeScan scan = null;
        try {
            message = objectMapper.readValue(new String(amqpMessage.getBody(), StandardCharsets.UTF_8), ResumeScanMessage.class);
            final Long scanId = message.getScanId();
            scan = resumeScanStateService.claimForProcessing(scanId);
            if (scan == null) {
                ResumeScan existing = resumeScanRepository.findById(scanId)
                        .orElseThrow(() -> new AmqpRejectAndDontRequeueException("Resume scan not found: " + scanId));
                if (TERMINAL_OR_ACTIVE_STATUSES.contains(existing.getStatus())) {
                    log.info("Skipping duplicate or already-processed resume scan {} with status {}", scanId, existing.getStatus());
                    return;
                }
                throw new AmqpRejectAndDontRequeueException("Resume scan cannot be claimed: " + scanId);
            }

            byte[] fileBytes;
            try (InputStream is = fileService.getFileStream(message.getStorageObjectKey())) {
                fileBytes = is.readAllBytes();
            }

            String extractedText = "";
            try {
                extractedText = resumeParserService.extractText(new ByteArrayInputStream(fileBytes));
            } catch (Exception e) {
                log.warn("Text extraction failed for scan {}. Falling back to vision-first path.", scan.getId(), e);
            }
            scan.setExtractedText(extractedText);
            String contentHash = null;
            if (extractedText != null && !extractedText.isBlank()) {
                contentHash = calculateHash(extractedText.getBytes(StandardCharsets.UTF_8));
            }
            scan = resumeScanStateService.markAnalyzing(scan.getId(), extractedText, contentHash);

            String atsJson;
            if (isTextCorrupted(extractedText)) {
                atsJson = geminiService.parseResume(fileBytes, message.getContentType());
            } else {
                atsJson = geminiService.parseResumeText(extractedText);
            }

            JsonNode normalized = scoringResultValidator.validateAndNormalize(objectMapper.readTree(atsJson));
            String enrichedJson = scanMapperService.enrichAndCalculateGaps(objectMapper.writeValueAsString(normalized));

            ResumeScanRawAiOutput rawOutput = rawAiOutputRepository.findByResumeScanId(scan.getId())
                    .orElse(ResumeScanRawAiOutput.builder().resumeScan(scan).build());
            rawOutput.setAtsJson(enrichedJson);
            rawOutput.setProfileJson("");
            rawOutput.setAiModel("gemini-3.1-flash-lite-preview");
            rawOutput.setPromptVersion("v1.0");
            rawAiOutputRepository.save(rawOutput);
            scan.setRawAiOutput(rawOutput);

            scanMapperService.populateScanResult(scan, enrichedJson);
            resumeScanStateService.markCompleted(scan.getId());
        } catch (Exception e) {
            log.error("Failed to process resume scan {}", message != null ? message.getScanId() : null, e);
            if (scan != null) {
                handleProcessingFailure(scan, e);
                if (isRetryable(e) && !hasExhaustedRetries(scan)) {
                    throw new RuntimeException("Retryable resume scan failure", e);
                }
                if (isRetryable(e)) {
                    throw new RuntimeException("Resume scan exhausted retries", e);
                }
            }
            if (e instanceof AmqpRejectAndDontRequeueException rejectAndDontRequeueException) {
                throw rejectAndDontRequeueException;
            }
            throw new AmqpRejectAndDontRequeueException("Resume scan processing failed", e);
        }
    }

    private void handleProcessingFailure(ResumeScan scan, Exception e) {
        if (isRetryable(e) && !hasExhaustedRetries(scan)) {
            resumeScanStateService.resetToPending(scan.getId());
            return;
        }
        resumeScanStateService.markFailed(scan.getId(), classifyFailureCode(e), safeFailureMessage(e));
    }

    private boolean hasExhaustedRetries(ResumeScan scan) {
        return (scan.getAttemptCount() == null ? 0 : scan.getAttemptCount()) >= MAX_RETRY_ATTEMPTS;
    }

    private String safeFailureMessage(Exception e) {
        String message = e.getMessage();
        if (message == null || message.isBlank()) {
            return e.getClass().getSimpleName();
        }
        return message.length() > 1000 ? message.substring(0, 1000) : message;
    }

    private boolean isTextCorrupted(String extractedText) {
        if (extractedText == null || extractedText.trim().length() < 300) {
            return true;
        }
        return !extractedText.contains("@") && !extractedText.matches(".*\\d{9,11}.*");
    }

    private boolean isRetryable(Throwable e) {
        Throwable current = e;
        while (current != null) {
            if (current instanceof TimeoutException
                    || current instanceof WebClientRequestException
                    || current instanceof WebClientResponseException.TooManyRequests
                    || current instanceof WebClientResponseException.InternalServerError
                    || current instanceof WebClientResponseException.BadGateway
                    || current instanceof WebClientResponseException.ServiceUnavailable
                    || current instanceof WebClientResponseException.GatewayTimeout) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private String classifyFailureCode(Exception e) {
        if (isRetryable(e)) {
            return "AI_TEMPORARY_FAILURE";
        }
        String name = e.getClass().getSimpleName().toUpperCase();
        if (name.contains("TIMEOUT")) {
            return "AI_TIMEOUT";
        }
        if (name.contains("JSON")) {
            return "AI_JSON_INVALID";
        }
        if (name.contains("WEBCLIENT")) {
            return "AI_CALL_FAILED";
        }
        return "SCAN_PROCESSING_FAILED";
    }

    private String calculateHash(byte[] bytes) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
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
            return java.util.UUID.randomUUID().toString();
        }
    }
}
