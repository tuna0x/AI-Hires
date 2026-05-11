package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class ScoringResultValidator {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Max scores maps for Sprint 2 (v1.1 weights - 50/40/10)
    private static final Map<String, Integer> MAX_SCORES = Map.ofEntries(
        Map.entry("file_technical", 3),
        Map.entry("ats_parsability", 5),
        Map.entry("typography", 2),
        Map.entry("length", 2),
        Map.entry("contact", 4),
        Map.entry("summary", 5),
        Map.entry("sections", 5),
        Map.entry("organization", 4),
        Map.entry("language", 5),
        Map.entry("quantification", 8),
        Map.entry("keywords", 4),
        Map.entry("consistency", 3),
        Map.entry("progression", 4),
        Map.entry("bullet_quality", 8),
        Map.entry("scope_impact", 8),
        Map.entry("technical_evidence", 10),
        Map.entry("projects", 7),
        Map.entry("certs", 3),
        Map.entry("leadership", 2),
        Map.entry("international", 2),
        Map.entry("awards", 2),
        Map.entry("learning", 2),
        Map.entry("category_specific", 2)
    );

    public JsonNode validateAndNormalize(JsonNode root) {
        if (root == null || root.isMissingNode() || !root.isObject()) {
            return root;
        }

        ObjectNode rootNode = (ObjectNode) root;

        // 1. Process stage2_core
        ObjectNode stage2Node = (ObjectNode) rootNode.path("stage2_core");
        int calculatedStage2 = 0;
        if (stage2Node != null && !stage2Node.isMissingNode()) {
            calculatedStage2 += processCategory(stage2Node, "ats_format", 
                new String[]{"file_technical", "ats_parsability", "typography", "length"});
            calculatedStage2 += processCategory(stage2Node, "professional_foundation", 
                new String[]{"contact", "summary", "sections", "organization"});
            calculatedStage2 += processCategory(stage2Node, "content_quality", 
                new String[]{"language", "quantification", "keywords", "consistency"});
            stage2Node.put("score", calculatedStage2);
        }

        // 2. Process stage3_in_depth
        ObjectNode stage3Node = (ObjectNode) rootNode.path("stage3_in_depth");
        int calculatedStage3 = 0;
        if (stage3Node != null && !stage3Node.isMissingNode()) {
            calculatedStage3 += processCategory(stage3Node, "experience_eval", 
                new String[]{"progression", "bullet_quality", "scope_impact"});
            calculatedStage3 += processCategory(stage3Node, "technical_evidence", 
                new String[]{"technical_evidence"});
            calculatedStage3 += processCategory(stage3Node, "projects", 
                new String[]{"projects"});
            calculatedStage3 += processCategory(stage3Node, "certs", 
                new String[]{"certs"});
            stage3Node.put("score", calculatedStage3);
        }

        // 3. Process stage4_bonus (currently under root, but can be under stage3_in_depth depending on frontend, let's support both)
        ObjectNode stage4Node = (ObjectNode) rootNode.path("stage4_bonus");
        if (stage4Node == null || stage4Node.isMissingNode()) {
            // check under stage3_in_depth.stage4_bonus
            if (stage3Node != null) {
                stage4Node = (ObjectNode) stage3Node.path("stage4_bonus");
            }
        }
        int calculatedStage4 = 0;
        if (stage4Node != null && !stage4Node.isMissingNode()) {
            calculatedStage4 = processBonusStage(stage4Node, 
                new String[]{"leadership", "international", "awards", "learning", "category_specific"});
            stage4Node.put("score", calculatedStage4);
        }

        // 4. Calculate total score
        int finalTotalScore = calculatedStage2 + calculatedStage3 + calculatedStage4;
        rootNode.put("total_score", finalTotalScore);

        log.info("Scoring validation complete. Corrected scores: Total={}, Stage2={}, Stage3={}, Stage4={}",
            finalTotalScore, calculatedStage2, calculatedStage3, calculatedStage4);

        return rootNode;
    }

    private int processCategory(ObjectNode parentNode, String categoryKey, String[] itemKeys) {
        ObjectNode categoryNode = (ObjectNode) parentNode.path(categoryKey);
        if (categoryNode == null || categoryNode.isMissingNode()) {
            return 0;
        }

        int categorySum = 0;
        ArrayNode detailsArray = (ArrayNode) categoryNode.path("details");
        if (detailsArray != null && detailsArray.isArray()) {
            for (int i = 0; i < detailsArray.size(); i++) {
                if (i >= itemKeys.length) break;
                String itemKey = itemKeys[i];
                int maxScore = MAX_SCORES.getOrDefault(itemKey, 10);
                String detailStr = detailsArray.get(i).asText();
                
                int[] scores = parseScores(detailStr, maxScore);
                int score = Math.max(0, Math.min(scores[0], maxScore));
                categorySum += score;

                // Rewrite the detail line string to match our clean output pattern
                String rewritten = clampAndRewriteDetailString(detailStr, score, maxScore);
                detailsArray.set(i, rewritten);
            }
        }
        categoryNode.put("score", categorySum);
        return categorySum;
    }

    private int processBonusStage(ObjectNode stage4Node, String[] itemKeys) {
        int bonusSum = 0;
        ArrayNode detailsArray = (ArrayNode) stage4Node.path("details");
        if (detailsArray != null && detailsArray.isArray()) {
            for (int i = 0; i < detailsArray.size(); i++) {
                if (i >= itemKeys.length) break;
                String itemKey = itemKeys[i];
                int maxScore = MAX_SCORES.getOrDefault(itemKey, 2);
                String detailStr = detailsArray.get(i).asText();

                int[] scores = parseScores(detailStr, maxScore);
                int score = Math.max(0, Math.min(scores[0], maxScore));
                bonusSum += score;

                String rewritten = clampAndRewriteDetailString(detailStr, score, maxScore);
                detailsArray.set(i, rewritten);
            }
        }
        return bonusSum;
    }

    public static int[] parseScores(String text, int defaultMax) {
        if (text == null) {
            return new int[]{0, defaultMax};
        }
        // Pattern 1: "+8/10" or "8/10"
        Pattern p1 = Pattern.compile("(\\+)?\\s*(\\d+)\\s*/\\s*(\\d+)");
        Matcher m1 = p1.matcher(text);
        if (m1.find()) {
            return new int[]{Integer.parseInt(m1.group(2)), Integer.parseInt(m1.group(3))};
        }

        // Pattern 2: "đạt 8 trên 10" or "8đ/10đ" or "8 điểm / 10 điểm"
        Pattern p2 = Pattern.compile("(\\d+)\\s*(?:trên|điểm|đ|of|/)\\s*(\\d+)");
        Matcher m2 = p2.matcher(text);
        if (m2.find()) {
            return new int[]{Integer.parseInt(m2.group(1)), Integer.parseInt(m2.group(2))};
        }

        // Fallback: search for numbers
        Pattern p3 = Pattern.compile("(\\d+)");
        Matcher m3 = p3.matcher(text);
        List<Integer> numbers = new ArrayList<>();
        while (m3.find()) {
            numbers.add(Integer.parseInt(m3.group(1)));
        }
        if (numbers.size() >= 2) {
            return new int[]{numbers.get(0), numbers.get(1)};
        } else if (numbers.size() == 1) {
            return new int[]{numbers.get(0), defaultMax};
        }

        return new int[]{0, defaultMax};
    }

    private String clampAndRewriteDetailString(String detail, int clampedScore, int maxScore) {
        if (detail == null) return "";
        Pattern p = Pattern.compile("(\\+)?\\s*\\d+\\s*/\\s*\\d+");
        Matcher m = p.matcher(detail);
        if (m.find()) {
            return m.replaceFirst("+" + clampedScore + "/" + maxScore);
        } else {
            // Check for format: score/max without '+'
            Pattern p2 = Pattern.compile("\\d+\\s*(?:trên|điểm|đ|of|/)\\s*\\d+");
            Matcher m2 = p2.matcher(detail);
            if (m2.find()) {
                return m2.replaceFirst("+" + clampedScore + "/" + maxScore);
            }
            return detail + " (+" + clampedScore + "/" + maxScore + ")";
        }
    }
}
