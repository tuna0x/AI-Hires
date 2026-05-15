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
import java.security.MessageDigest;
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
    @org.springframework.beans.factory.annotation.Value("${app.gemini.model-name:gemini-3.1-flash-lite}")
    private String geminiModelName;
    @org.springframework.beans.factory.annotation.Value("${app.gemini.prompt-version:v1.0}")
    private String promptVersion;
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final Set<ResumeScanStatusEnum> TERMINAL_OR_ACTIVE_STATUSES = Set.of(
            ResumeScanStatusEnum.EXTRACTING,
            ResumeScanStatusEnum.ANALYZING,
            ResumeScanStatusEnum.COMPLETED,
            ResumeScanStatusEnum.FAILED
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
            boolean textExtractionSucceeded = true;
            try {
                extractedText = resumeParserService.extractText(new ByteArrayInputStream(fileBytes));
            } catch (Exception e) {
                textExtractionSucceeded = false;
                log.warn("Text extraction failed for scan {}. Falling back to vision-first path.", scan.getId(), e);
            }
            scan.setExtractedText(extractedText);
            String contentHash = null;
            if (extractedText != null && !extractedText.isBlank()) {
                contentHash = com.project.AIH.utils.HashUtils.calculateHash(extractedText.getBytes(StandardCharsets.UTF_8));
            }
            scan = resumeScanStateService.markAnalyzing(scan.getId(), extractedText, contentHash);

            String atsJson;
            if (shouldUseVisionFirst(message.getContentType(), extractedText, textExtractionSucceeded)) {
                atsJson = parseResumeWithTextFallback(fileBytes, message.getContentType(), extractedText, textExtractionSucceeded);
            } else {
                atsJson = geminiService.parseResumeText(extractedText);
            }

            JsonNode normalized = scoringResultValidator.validateAndNormalize(objectMapper.readTree(atsJson));
            String enrichedJson = scanMapperService.enrichAndCalculateGaps(objectMapper.writeValueAsString(normalized));

            ResumeScanRawAiOutput rawOutput = rawAiOutputRepository.findByResumeScanId(scan.getId())
                    .orElse(ResumeScanRawAiOutput.builder().resumeScan(scan).build());
            rawOutput.setRawAiJson(atsJson);
            rawOutput.setAtsJson(enrichedJson);
            rawOutput.setProfileJson("");
            rawOutput.setAiModel(geminiModelName);
            rawOutput.setPromptVersion(promptVersion);
            rawOutput.setPromptHash(com.project.AIH.utils.HashUtils.calculateHash(promptVersion));
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
                throw new AmqpRejectAndDontRequeueException("Resume scan processing failed", e);
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

    boolean shouldUseVisionFirst(String contentType, String extractedText, boolean textExtractionSucceeded) {
        return !textExtractionSucceeded || isTextCorrupted(extractedText);
    }

    boolean isTextCorrupted(String extractedText) {
        if (extractedText == null) {
            return true;
        }

        String trimmed = extractedText.trim();
        if (trimmed.length() < 80) {
            return true;
        }

        int suspiciousChars = 0;
        int letters = 0;
        for (int i = 0; i < trimmed.length(); i++) {
            char ch = trimmed.charAt(i);
            if (ch == '\uFFFD' || (Character.isISOControl(ch) && !Character.isWhitespace(ch))) {
                suspiciousChars++;
            }
            if (Character.isLetter(ch)) {
                letters++;
            }
        }

        double suspiciousRatio = (double) suspiciousChars / trimmed.length();
        double letterRatio = (double) letters / trimmed.length();
        return suspiciousRatio > 0.03 || letterRatio < 0.25;
    }

    private String parseResumeWithTextFallback(byte[] fileBytes, String contentType, String extractedText, boolean textExtractionSucceeded) {
        try {
            return geminiService.parseResume(fileBytes, contentType);
        } catch (RuntimeException e) {
            if (hasCause(e, WebClientResponseException.BadRequest.class)
                    && textExtractionSucceeded
                    && extractedText != null
                    && !extractedText.trim().isEmpty()) {
                log.warn("Gemini vision request returned 400. Falling back to text-only resume analysis.");
                return geminiService.parseResumeText(extractedText);
            }
            throw e;
        }
    }

    private boolean hasCause(Throwable throwable, Class<? extends Throwable> causeType) {
        Throwable current = throwable;
        while (current != null) {
            if (causeType.isInstance(current)) {
                return true;
            }
            current = current.getCause();
        }
        return false;
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

}
