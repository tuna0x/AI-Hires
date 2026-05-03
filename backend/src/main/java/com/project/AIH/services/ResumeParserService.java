package com.project.AIH.services;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@Slf4j
public class ResumeParserService {

    private final Tika tika = new Tika();

    public String extractText(InputStream inputStream) {
        try {
            log.info("Extracting text from resume...");
            return tika.parseToString(inputStream);
        } catch (Exception e) {
            log.error("Error extracting text from resume: {}", e.getMessage());
            throw new RuntimeException("Could not extract text from resume file", e);
        }
    }
}
