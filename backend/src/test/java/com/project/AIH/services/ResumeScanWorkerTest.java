package com.project.AIH.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.dto.ResumeScanMessage;
import com.project.AIH.models.ResumeScan;
import com.project.AIH.repositories.ResumeScanRawAiOutputRepository;
import com.project.AIH.repositories.ResumeScanRepository;
import com.project.AIH.utils.constant.ResumeScanStatusEnum;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ResumeScanWorkerTest {

    private final ResumeScanWorker worker = new ResumeScanWorker(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            new ObjectMapper()
    );

    @Test
    void shouldUseTextOnlyForPdfWhenTextExtractionSucceedsWithCleanText() {
        assertFalse(worker.shouldUseVisionFirst(
                "application/pdf",
                "Clean extracted resume text with enough useful content. " +
                        "This includes experience, education, contact details, projects, and skills.",
                true
        ));
    }

    @Test
    void shouldUseTextOnlyForDocxWhenTextExtractionSucceeds() {
        assertFalse(worker.shouldUseVisionFirst(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Clean extracted resume text with enough useful content. " +
                        "This includes experience, education, contact details, projects, and skills.",
                true
        ));
    }

    @Test
    void shouldUseVisionFirstForDocxWhenExtractionFailsOrReturnsBlankText() {
        assertTrue(worker.shouldUseVisionFirst(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Clean resume text",
                false
        ));
        assertTrue(worker.shouldUseVisionFirst(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                " ",
                true
        ));
    }

    @Test
    void shouldUseVisionFirstForCorruptedText() {
        assertTrue(worker.shouldUseVisionFirst(
                "application/pdf",
                "\uFFFD\uFFFD\uFFFD\uFFFD 12345 !!! ??? \u0000\u0001 ----- //// 99999",
                true
        ));
    }

    @Test
    void retryableFailureBeforeExhaustionResetsToPendingAndRequeues() throws Exception {
        ResumeScanStateService stateService = mock(ResumeScanStateService.class);
        FileService fileService = mock(FileService.class);
        ResumeParserService parserService = mock(ResumeParserService.class);
        GeminiService geminiService = mock(GeminiService.class);
        ResumeScan scan = ResumeScan.builder()
                .id(10L)
                .status(ResumeScanStatusEnum.EXTRACTING)
                .attemptCount(1)
                .build();

        ResumeScanWorker testWorker = workerWith(null, null, fileService, parserService, geminiService, null, null, stateService);
        when(stateService.claimForProcessing(10L)).thenReturn(scan);
        when(fileService.getFileStream("resume.pdf")).thenReturn(new ByteArrayInputStream("pdf".getBytes(StandardCharsets.UTF_8)));
        when(parserService.extractText(any())).thenReturn(cleanResumeText());
        when(stateService.markAnalyzing(eq(10L), anyString(), anyString())).thenReturn(scan);
        when(geminiService.parseResumeText(anyString())).thenThrow(new RuntimeException(new TimeoutException("timeout")));

        assertThrows(RuntimeException.class, () -> testWorker.processScan(message(10L)));
        verify(stateService).resetToPending(10L);
        verify(stateService, never()).markFailed(eq(10L), anyString(), anyString());
    }

    @Test
    void exhaustedRetryableFailureMarksFailedAndDoesNotRequeue() throws Exception {
        ResumeScanStateService stateService = mock(ResumeScanStateService.class);
        FileService fileService = mock(FileService.class);
        ResumeParserService parserService = mock(ResumeParserService.class);
        GeminiService geminiService = mock(GeminiService.class);
        ResumeScan scan = ResumeScan.builder()
                .id(10L)
                .status(ResumeScanStatusEnum.EXTRACTING)
                .attemptCount(3)
                .build();

        ResumeScanWorker testWorker = workerWith(null, null, fileService, parserService, geminiService, null, null, stateService);
        when(stateService.claimForProcessing(10L)).thenReturn(scan);
        when(fileService.getFileStream("resume.pdf")).thenReturn(new ByteArrayInputStream("pdf".getBytes(StandardCharsets.UTF_8)));
        when(parserService.extractText(any())).thenReturn(cleanResumeText());
        when(stateService.markAnalyzing(eq(10L), anyString(), anyString())).thenReturn(scan);
        when(geminiService.parseResumeText(anyString())).thenThrow(new RuntimeException(new TimeoutException("timeout")));

        assertThrows(AmqpRejectAndDontRequeueException.class, () -> testWorker.processScan(message(10L)));
        verify(stateService).markFailed(eq(10L), eq("AI_TEMPORARY_FAILURE"), anyString());
        verify(stateService, never()).resetToPending(10L);
    }

    @Test
    void failedScanIsNotClaimedAgainFromDuplicateMessage() throws Exception {
        ResumeScanStateService stateService = mock(ResumeScanStateService.class);
        ResumeScanRepository scanRepository = mock(ResumeScanRepository.class);
        ResumeScan failedScan = ResumeScan.builder()
                .id(10L)
                .status(ResumeScanStatusEnum.FAILED)
                .attemptCount(3)
                .build();

        ResumeScanWorker testWorker = workerWith(scanRepository, null, null, null, null, null, null, stateService);
        when(stateService.claimForProcessing(10L)).thenReturn(null);
        when(scanRepository.findById(10L)).thenReturn(Optional.of(failedScan));

        assertDoesNotThrow(() -> testWorker.processScan(message(10L)));
        verify(stateService, never()).markAnalyzing(eq(10L), anyString(), anyString());
        verify(stateService, never()).resetToPending(10L);
        verify(stateService, never()).markFailed(eq(10L), anyString(), anyString());
    }

    private ResumeScanWorker workerWith(
            ResumeScanRepository scanRepository,
            ResumeScanRawAiOutputRepository rawAiOutputRepository,
            FileService fileService,
            ResumeParserService parserService,
            GeminiService geminiService,
            ScanMapperService scanMapperService,
            ScoringResultValidator validator,
            ResumeScanStateService stateService
    ) {
        return new ResumeScanWorker(
                scanRepository,
                rawAiOutputRepository,
                fileService,
                parserService,
                geminiService,
                scanMapperService,
                validator,
                stateService,
                new ObjectMapper()
        );
    }

    private Message message(Long scanId) throws Exception {
        ResumeScanMessage payload = ResumeScanMessage.builder()
                .scanId(scanId)
                .storageObjectKey("resume.pdf")
                .contentType("application/pdf")
                .fileHash("hash")
                .build();
        return MessageBuilder.withBody(new ObjectMapper().writeValueAsBytes(payload))
                .setContentType("application/json")
                .build();
    }

    private String cleanResumeText() {
        return "Clean extracted resume text with enough useful content. " +
                "This includes experience, education, contact details, projects, skills, achievements, and measurable impact.";
    }
}
