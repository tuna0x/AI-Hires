package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ScoringResultValidatorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ScoringResultValidator validator = new ScoringResultValidator();

    @Test
    void validateAndNormalizePadsMissingDetailsAndIgnoresExtras() throws Exception {
        JsonNode input = objectMapper.readTree("""
                {
                  "stage2_core": {
                    "ats_format": {
                      "details": [
                        "Typography: +2/2",
                        "File Technical: +3/3",
                        "Unexpected extra detail: +10/10"
                      ]
                    },
                    "professional_foundation": { "details": [] },
                    "content_quality": { "details": [] }
                  },
                  "stage3_in_depth": {
                    "experience_eval": { "details": [] },
                    "technical_evidence": { "details": [] },
                    "projects": { "details": [] },
                    "certs": { "details": [] }
                  },
                  "stage4_bonus": { "details": [] }
                }
                """);

        JsonNode normalized = validator.validateAndNormalize(input);
        JsonNode details = normalized.path("stage2_core").path("ats_format").path("details");

        assertEquals(4, details.size());
        assertEquals("File Technical: +3/3", details.get(0).asText());
        assertEquals("Ats Parsability: +0/5 (Missing from AI output)", details.get(1).asText());
        assertEquals("Typography: +2/2", details.get(2).asText());
        assertEquals("Length: +0/2 (Missing from AI output)", details.get(3).asText());
        assertEquals(5, normalized.path("stage2_core").path("ats_format").path("score").asInt());
    }

    @Test
    void validateAndNormalizeRecalculatesTotalsFromNormalizedDetails() throws Exception {
        JsonNode input = objectMapper.readTree("""
                {
                  "stage2_core": {
                    "ats_format": { "details": ["File Technical: +3/3", "ATS Parsability: +5/5", "Typography: +2/2", "Length: +2/2"] },
                    "professional_foundation": { "details": ["Contact: +4/4", "Summary: +5/5", "Sections: +5/5", "Organization: +4/4"] },
                    "content_quality": { "details": ["Language: +5/5", "Quantification: +8/8", "Keywords: +4/4", "Consistency: +3/3"] }
                  },
                  "stage3_in_depth": {
                    "experience_eval": { "details": ["Progression: +4/4", "Bullet Quality: +8/8", "Scope & Impact: +8/8"] },
                    "technical_evidence": { "details": ["Technical Evidence: +10/10"] },
                    "projects": { "details": ["Projects: +7/7"] },
                    "certs": { "details": ["Certs: +3/3"] }
                  },
                  "stage4_bonus": { "details": ["Leadership: +2/2", "International: +2/2", "Awards: +2/2", "Learning: +2/2", "Category-Specific: +2/2"] }
                }
                """);

        JsonNode normalized = validator.validateAndNormalize(input);

        assertEquals(50, normalized.path("stage2_core").path("score").asInt());
        assertEquals(40, normalized.path("stage3_in_depth").path("score").asInt());
        assertEquals(10, normalized.path("stage4_bonus").path("score").asInt());
        assertEquals(100, normalized.path("total_score").asInt());
    }
}
