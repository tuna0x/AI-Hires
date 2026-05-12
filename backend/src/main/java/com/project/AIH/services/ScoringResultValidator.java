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
    private static final Map<String, String[]> CATEGORY_KEYS = Map.of(
            "ats_format", new String[]{"file_technical", "ats_parsability", "typography", "length"},
            "professional_foundation", new String[]{"contact", "summary", "sections", "organization"},
            "content_quality", new String[]{"language", "quantification", "keywords", "consistency"},
            "experience_eval", new String[]{"progression", "bullet_quality", "scope_impact"},
            "technical_evidence", new String[]{"technical_evidence"},
            "projects", new String[]{"projects"},
            "certs", new String[]{"certs"},
            "stage4_bonus", new String[]{"leadership", "international", "awards", "learning", "category_specific"}
    );

    public JsonNode validateAndNormalize(JsonNode root) {
        if (root == null || root.isMissingNode() || !root.isObject()) {
            return root;
        }

        ObjectNode rootNode = (ObjectNode) root;

        // 1. Process stage2_core
        ObjectNode stage2Node = ensureObject(rootNode, "stage2_core");
        int calculatedStage2 = 0;
        if (stage2Node != null) {
            calculatedStage2 += processCategory(stage2Node, "ats_format", 
                new String[]{"file_technical", "ats_parsability", "typography", "length"});
            calculatedStage2 += processCategory(stage2Node, "professional_foundation", 
                new String[]{"contact", "summary", "sections", "organization"});
            calculatedStage2 += processCategory(stage2Node, "content_quality", 
                new String[]{"language", "quantification", "keywords", "consistency"});
            stage2Node.put("score", calculatedStage2);
        }

        // 2. Process stage3_in_depth
        ObjectNode stage3Node = ensureObject(rootNode, "stage3_in_depth");
        int calculatedStage3 = 0;
        if (stage3Node != null) {
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
        ObjectNode stage4Node = objectNodeOrNull(rootNode.path("stage4_bonus"));
        if (stage4Node == null && stage3Node != null) {
            stage4Node = objectNodeOrNull(stage3Node.path("stage4_bonus"));
        }
        if (stage4Node == null) {
            stage4Node = rootNode.putObject("stage4_bonus");
        }
        int calculatedStage4 = 0;
        if (stage4Node != null) {
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
        ObjectNode categoryNode = ensureObject(parentNode, categoryKey);

        int categorySum = 0;
        ArrayNode detailsArray = normalizeDetailsArray(categoryNode, categoryKey, itemKeys);
        for (int i = 0; i < itemKeys.length; i++) {
            String itemKey = itemKeys[i];
            int maxScore = MAX_SCORES.getOrDefault(itemKey, 10);
            String detailStr = detailsArray.get(i).asText();

            int[] scores = parseScores(detailStr, maxScore);
            int score = Math.max(0, Math.min(scores[0], maxScore));
            categorySum += score;

            String rewritten = clampAndRewriteDetailString(detailStr, score, maxScore);
            detailsArray.set(i, rewritten);
        }
        categoryNode.put("score", categorySum);
        return categorySum;
    }

    private int processBonusStage(ObjectNode stage4Node, String[] itemKeys) {
        int bonusSum = 0;
        ArrayNode detailsArray = normalizeDetailsArray(stage4Node, "stage4_bonus", itemKeys);
        for (int i = 0; i < itemKeys.length; i++) {
            String itemKey = itemKeys[i];
            int maxScore = MAX_SCORES.getOrDefault(itemKey, 2);
            String detailStr = detailsArray.get(i).asText();

            int[] scores = parseScores(detailStr, maxScore);
            int score = Math.max(0, Math.min(scores[0], maxScore));
            bonusSum += score;

            String rewritten = clampAndRewriteDetailString(detailStr, score, maxScore);
            detailsArray.set(i, rewritten);
        }
        return bonusSum;
    }

    private ObjectNode ensureObject(ObjectNode parentNode, String fieldName) {
        JsonNode node = parentNode.path(fieldName);
        if (node instanceof ObjectNode objectNode) {
            return objectNode;
        }
        if (!node.isMissingNode() && !node.isNull()) {
            log.warn("Field '{}' is not an object. Replacing it with an empty object.", fieldName);
        }
        return parentNode.putObject(fieldName);
    }

    private ObjectNode objectNodeOrNull(JsonNode node) {
        return node instanceof ObjectNode objectNode ? objectNode : null;
    }

    private ArrayNode normalizeDetailsArray(ObjectNode categoryNode, String categoryKey, String[] itemKeys) {
        JsonNode detailsNode = categoryNode.path("details");
        ArrayNode input = detailsNode instanceof ArrayNode arrayNode ? arrayNode : objectMapper.createArrayNode();
        if (!detailsNode.isMissingNode() && !detailsNode.isArray()) {
            log.warn("Category '{}' has non-array details. Replacing with defaults.", categoryKey);
        }
        if (input.size() != itemKeys.length) {
            log.warn("Category '{}' has {} detail items, expected {}", categoryKey, input.size(), itemKeys.length);
        }

        Map<String, String> keyedDetails = new HashMap<>();
        List<String> unmappedDetails = new ArrayList<>();
        for (JsonNode detailNode : input) {
            String detailText = detailNode.asText("");
            String sectionKey = deriveSectionKey(detailText, categoryKey, itemKeys);
            if (sectionKey == null) {
                unmappedDetails.add(detailText);
                continue;
            }
            if (keyedDetails.containsKey(sectionKey)) {
                log.warn("Category '{}' has duplicate detail for key '{}'. Keeping the first value.", categoryKey, sectionKey);
                continue;
            }
            keyedDetails.put(sectionKey, detailText);
        }

        ArrayNode normalized = objectMapper.createArrayNode();
        for (String itemKey : itemKeys) {
            String detail = keyedDetails.get(itemKey);
            if (detail == null || detail.isBlank()) {
                int maxScore = MAX_SCORES.getOrDefault(itemKey, 10);
                detail = humanizeKey(itemKey) + ": +0/" + maxScore + " (Missing from AI output)";
            }
            normalized.add(detail);
        }

        if (!unmappedDetails.isEmpty()) {
            log.warn("Category '{}' has {} unmapped detail items. Ignoring them.", categoryKey, unmappedDetails.size());
        }
        categoryNode.set("details", normalized);
        return normalized;
    }

    private String deriveSectionKey(String detailText, String categoryKey, String[] keys) {
        if (keys.length == 1) {
            return keys[0];
        }
        if (detailText == null) {
            return null;
        }
        String lower = detailText.toLowerCase(Locale.ROOT);
        for (String key : keys) {
            String normalized = key.replace("_", " ").toLowerCase(Locale.ROOT);
            if (lower.contains(normalized)) {
                return key;
            }
        }
        if (lower.contains("file technical")) return "file_technical";
        if (lower.contains("parsability")) return "ats_parsability";
        if (lower.contains("typography")) return "typography";
        if (lower.contains("length")) return "length";
        if (lower.contains("contact")) return "contact";
        if (lower.contains("summary")) return "summary";
        if (lower.contains("sections")) return "sections";
        if (lower.contains("organization")) return "organization";
        if (lower.contains("language")) return "language";
        if (lower.contains("quantification")) return "quantification";
        if (lower.contains("keywords")) return "keywords";
        if (lower.contains("consistency")) return "consistency";
        if (lower.contains("progression")) return "progression";
        if (lower.contains("bullet")) return "bullet_quality";
        if (lower.contains("scope")) return "scope_impact";
        if (lower.contains("leadership")) return "leadership";
        if (lower.contains("international")) return "international";
        if (lower.contains("award")) return "awards";
        if (lower.contains("learning")) return "learning";
        if (lower.contains("category")) return "category_specific";
        log.warn("Could not derive a schema key for category '{}' detail '{}'", categoryKey, detailText);
        return null;
    }

    private String humanizeKey(String key) {
        return Arrays.stream(key.split("_"))
                .filter(part -> !part.isBlank())
                .map(part -> part.substring(0, 1).toUpperCase(Locale.ROOT) + part.substring(1))
                .reduce((left, right) -> left + " " + right)
                .orElse(key);
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

    public Map<String, String[]> getCategoryKeys() {
        return CATEGORY_KEYS;
    }
}
