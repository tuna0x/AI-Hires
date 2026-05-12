package com.project.AIH.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    void shouldAlwaysUseVisionFirstForPdf() {
        assertTrue(worker.shouldUseVisionFirst(
                "application/pdf",
                "Clean extracted text with enough useful content.",
                true
        ));
    }

    @Test
    void shouldUseTextOnlyForDocxWhenTextExtractionSucceeds() {
        assertFalse(worker.shouldUseVisionFirst(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Short but clean resume text",
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
}
