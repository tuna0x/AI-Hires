package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project.AIH.models.ActionPriorityEnum;
import com.project.AIH.models.ResumeScan;
import com.project.AIH.models.ScanAction;
import com.project.AIH.models.ScanScore;
import com.project.AIH.models.ScanSubScore;
import com.project.AIH.models.User;
import com.project.AIH.repositories.ResumeScanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanMapperService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ResumeScanRepository resumeScanRepository;
    @Transactional
    public ResumeScan saveScanResult(User user, String fileName, String fileHash, String rawJson) {
        ResumeScan scan = ResumeScan.builder()
                .user(user)
                .fileName(fileName)
                .storageObjectKey(fileName)
                .fileHash(fileHash)
                .scannedAt(Instant.now())
                .build();
        scan = resumeScanRepository.save(scan);
        return populateScanResult(scan, rawJson);
    }

    @Transactional
    public ResumeScan populateScanResult(ResumeScan scan, String rawJson) {
        try {
            ResumeScan managedScan = resumeScanRepository.findById(scan.getId())
                    .orElseThrow(() -> new RuntimeException("Resume scan not found: " + scan.getId()));
            JsonNode root = objectMapper.readTree(rawJson);

            JsonNode detection = root.path("stage1_detection");
            managedScan.setCandidateName(detection.path("name").asText(""));
            managedScan.setLevel(detection.path("level").asText(""));
            managedScan.setIndustry(detection.path("industry").asText(""));
            managedScan.setTotalScore(root.path("total_score").asInt(0));
            managedScan.setStage2Score(root.path("stage2_core").path("score").asInt(0));
            managedScan.setStage3Score(root.path("stage3_in_depth").path("score").asInt(0));
            managedScan.setStage4Score(root.path("stage4_bonus").path("score").asInt(0));

            List<String> strengths = new ArrayList<>();
            JsonNode strengthsNode = root.path("strengths");
            if (strengthsNode.isArray()) {
                for (JsonNode strength : strengthsNode) {
                    strengths.add(strength.asText());
                }
            }
            managedScan.setStrengths(strengths);

            Map<String, String> tipsMap = new HashMap<>();
            JsonNode tipsNode = root.path("sub_tips");
            if (!tipsNode.isMissingNode()) {
                Iterator<Map.Entry<String, JsonNode>> fields = tipsNode.fields();
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> field = fields.next();
                    if (field.getValue() != null && !field.getValue().isNull()) {
                        tipsMap.put(field.getKey(), field.getValue().asText());
                    }
                }
            }

            List<ScanSubScore> managedSubScores = managedScan.getSubScores();
            if (managedSubScores == null) {
                managedSubScores = new ArrayList<>();
                managedScan.setSubScores(managedSubScores);
            } else {
                managedSubScores.clear();
            }

            List<ScanAction> managedActions = managedScan.getActions();
            if (managedActions == null) {
                managedActions = new ArrayList<>();
                managedScan.setActions(managedActions);
            } else {
                managedActions.clear();
            }

            List<ScanSubScore> subScores = new ArrayList<>();
            extractCategorySubScores(managedScan, root.path("stage2_core").path("ats_format"), "ats_format",
                    new String[]{"file_technical", "ats_parsability", "typography", "length"}, tipsMap, subScores);
            extractCategorySubScores(managedScan, root.path("stage2_core").path("professional_foundation"), "professional_foundation",
                    new String[]{"contact", "summary", "sections", "organization"}, tipsMap, subScores);
            extractCategorySubScores(managedScan, root.path("stage2_core").path("content_quality"), "content_quality",
                    new String[]{"language", "quantification", "keywords", "consistency"}, tipsMap, subScores);
            extractCategorySubScores(managedScan, root.path("stage3_in_depth").path("experience_eval"), "experience_eval",
                    new String[]{"progression", "bullet_quality", "scope_impact"}, tipsMap, subScores);
            extractCategorySubScores(managedScan, root.path("stage3_in_depth").path("technical_evidence"), "technical_evidence",
                    new String[]{"technical_evidence"}, tipsMap, subScores);
            extractCategorySubScores(managedScan, root.path("stage3_in_depth").path("projects"), "projects",
                    new String[]{"projects"}, tipsMap, subScores);
            extractCategorySubScores(managedScan, root.path("stage3_in_depth").path("certs"), "certs",
                    new String[]{"certs"}, tipsMap, subScores);
            extractCategorySubScores(managedScan, root.path("stage4_bonus"), "stage4_bonus",
                    new String[]{"leadership", "international", "awards", "learning", "category_specific"}, tipsMap, subScores);

            managedSubScores.addAll(subScores);

            List<ScanAction> actions = new ArrayList<>();
            JsonNode actionsNode = root.path("priority_actions");
            if (actionsNode.isArray()) {
                int index = 0;
                for (JsonNode actionNode : actionsNode) {
                    String prioStr = actionNode.path("priority").asText("Trung binh").toLowerCase();
                    ActionPriorityEnum prioEnum = ActionPriorityEnum.MEDIUM;
                    if (prioStr.contains("cao") || prioStr.contains("high")) {
                        prioEnum = ActionPriorityEnum.HIGH;
                    } else if (prioStr.contains("thap") || prioStr.contains("low")) {
                        prioEnum = ActionPriorityEnum.LOW;
                    }

                    actions.add(ScanAction.builder()
                            .scan(managedScan)
                            .action(actionNode.path("action").asText(""))
                            .priority(prioEnum)
                            .sortOrder(index++)
                            .build());
                }
            }
            managedActions.addAll(actions);

            return resumeScanRepository.save(managedScan);
        } catch (Exception e) {
            log.error("Failed to map Gemini JSON to structured tables: {}", e.getMessage(), e);
            throw new RuntimeException("Database structuring failed", e);
        }
    }

    private void extractCategorySubScores(ResumeScan scan, JsonNode categoryNode, String categoryName,
                                          String[] keys, Map<String, String> tipsMap, List<ScanSubScore> subScores) {
        if (categoryNode == null || categoryNode.isMissingNode()) {
            return;
        }

        JsonNode detailsNode = categoryNode.path("details");
        if (detailsNode.isArray()) {
            for (int i = 0; i < detailsNode.size(); i++) {
                String detailText = detailsNode.get(i).asText();
                String sectionKey = (i < keys.length) ? keys[i] : (categoryName + "_item_" + i);

                int[] parsed = parseScores(detailText);
                int maxScore = parsed[1];
                int score = Math.max(0, Math.min(parsed[0], maxScore));
                int lostPoints = maxScore - score;

                subScores.add(ScanSubScore.builder()
                        .scan(scan)
                        .sectionKey(sectionKey)
                        .score(score)
                        .maxScore(maxScore)
                        .lostPoints(lostPoints)
                        .details(Collections.singletonList(detailText))
                        .tip(tipsMap.get(sectionKey))
                        .build());
            }
        }
    }

    private int[] parseScores(String text) {
        return ScoringResultValidator.parseScores(text, 10);
    }

    @Transactional(readOnly = true)
    public String reconstructJson(ResumeScan scan) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            ScanScore scoreSummary = scan.getScoreSummary();
            root.put("total_score", scoreSummary != null ? scoreSummary.getTotalScore() : 0);

            ObjectNode detection = root.putObject("stage1_detection");
            detection.put("name", scan.getCandidateName());
            detection.put("level", scan.getLevel());
            detection.put("industry", scan.getIndustry());

            Map<String, List<String>> detailsMap = new HashMap<>();
            Map<String, Integer> categoryScores = new HashMap<>();

            List<ScanSubScore> subScores = scan.getSubScores();
            if (subScores != null) {
                for (ScanSubScore sub : subScores) {
                    String category = getCategoryForSectionKey(sub.getSectionKey());
                    detailsMap.computeIfAbsent(category, k -> new ArrayList<>()).addAll(sub.getDetails());
                    categoryScores.put(category, categoryScores.getOrDefault(category, 0) + sub.getScore());
                }
            }

            ObjectNode stage2 = root.putObject("stage2_core");
            stage2.put("score", scoreSummary != null ? scoreSummary.getStage2Score() : 0);
            populateCategoryNode(stage2, "ats_format", detailsMap, categoryScores);
            populateCategoryNode(stage2, "professional_foundation", detailsMap, categoryScores);
            populateCategoryNode(stage2, "content_quality", detailsMap, categoryScores);

            ObjectNode stage3 = root.putObject("stage3_in_depth");
            stage3.put("score", scoreSummary != null ? scoreSummary.getStage3Score() : 0);
            populateCategoryNode(stage3, "experience_eval", detailsMap, categoryScores);
            populateCategoryNode(stage3, "technical_evidence", detailsMap, categoryScores);
            populateCategoryNode(stage3, "projects", detailsMap, categoryScores);
            populateCategoryNode(stage3, "certs", detailsMap, categoryScores);

            ObjectNode stage4 = root.putObject("stage4_bonus");
            stage4.put("score", scoreSummary != null ? scoreSummary.getStage4Score() : 0);
            ArrayNode bonusDetails = stage4.putArray("details");
            if (detailsMap.containsKey("stage4_bonus")) {
                for (String detail : detailsMap.get("stage4_bonus")) {
                    bonusDetails.add(detail);
                }
            }

            ArrayNode strengthsNode = root.putArray("strengths");
            if (scoreSummary != null && scoreSummary.getStrengths() != null) {
                for (String strength : scoreSummary.getStrengths()) {
                    strengthsNode.add(strength);
                }
            }

            ArrayNode actionsNode = root.putArray("priority_actions");
            if (scan.getActions() != null) {
                scan.getActions().stream()
                        .sorted(Comparator.comparing(ScanAction::getSortOrder))
                        .forEach(action -> {
                            ObjectNode actionObj = actionsNode.addObject();
                            actionObj.put("action", action.getAction());
                            actionObj.put("priority", action.getPriority() != null ? action.getPriority().name() : "MEDIUM");
                        });
            }

            ObjectNode subTips = root.putObject("sub_tips");
            if (subScores != null) {
                for (ScanSubScore sub : subScores) {
                    if (sub.getTip() != null) {
                        subTips.put(sub.getSectionKey(), sub.getTip());
                    } else {
                        subTips.putNull(sub.getSectionKey());
                    }
                }
            }

            ArrayNode gapsNode = root.putArray("score_gaps");
            if (subScores != null) {
                subScores.stream()
                        .filter(sub -> sub.getLostPoints() != null && sub.getLostPoints() > 0)
                        .sorted((a, b) -> Integer.compare(b.getLostPoints(), a.getLostPoints()))
                        .limit(5)
                        .forEach(sub -> {
                            ObjectNode gap = gapsNode.addObject();
                            gap.put("section", getHumanReadableSectionName(sub.getSectionKey()));
                            gap.put("current", sub.getScore());
                            gap.put("max", sub.getMaxScore());
                            gap.put("lost", sub.getLostPoints());
                            gap.put("tip", sub.getTip());
                        });
            }

            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            log.error("Failed to reconstruct JSON from structured tables: {}", e.getMessage(), e);
            return "{}";
        }
    }

    private void populateCategoryNode(ObjectNode parentNode, String categoryName,
                                      Map<String, List<String>> detailsMap, Map<String, Integer> categoryScores) {
        ObjectNode cat = parentNode.putObject(categoryName);
        cat.put("score", categoryScores.getOrDefault(categoryName, 0));
        ArrayNode details = cat.putArray("details");
        if (detailsMap.containsKey(categoryName)) {
            for (String detail : detailsMap.get(categoryName)) {
                details.add(detail);
            }
        }
    }

    private String getCategoryForSectionKey(String key) {
        if (key.equals("file_technical") || key.equals("ats_parsability") || key.equals("typography") || key.equals("length")) {
            return "ats_format";
        }
        if (key.equals("contact") || key.equals("summary") || key.equals("sections") || key.equals("organization")) {
            return "professional_foundation";
        }
        if (key.equals("language") || key.equals("quantification") || key.equals("keywords") || key.equals("consistency") || key.equals("action_verbs_tone")) {
            return "content_quality";
        }
        if (key.equals("progression") || key.equals("bullet_quality") || key.equals("scope_impact")) {
            return "experience_eval";
        }
        if (key.equals("technical_evidence")) {
            return "technical_evidence";
        }
        if (key.equals("projects")) {
            return "projects";
        }
        if (key.equals("certs")) {
            return "certs";
        }
        return "stage4_bonus";
    }

    public String getHumanReadableSectionName(String key) {
        switch (key) {
            case "file_technical": return "File Technical";
            case "ats_parsability": return "ATS Parsability";
            case "typography": return "Typography";
            case "length": return "Length";
            case "contact": return "Contact Info";
            case "summary": return "Summary/Objective";
            case "sections": return "Important Sections";
            case "organization": return "Chronological/Organization";
            case "language": return "Action Verbs & Language";
            case "quantification": return "Quantification";
            case "keywords": return "Industry Keywords";
            case "action_verbs_tone": return "Action Verbs & Tone";
            case "consistency": return "Consistency";
            case "progression": return "Work Progression";
            case "bullet_quality": return "Bullet Point Quality";
            case "scope_impact": return "Scope & Impact";
            case "technical_evidence": return "Technical Evidence";
            case "projects": return "Projects Evaluation";
            case "certs": return "Certifications";
            case "leadership": return "Leadership";
            case "international": return "International Experience";
            case "awards": return "Awards & Achievements";
            case "learning": return "Continuous Learning";
            case "category_specific": return "Category-Specific Expertise";
            default: return "Additional Sections";
        }
    }

    public String enrichAndCalculateGaps(String rawJson) {
        if (rawJson == null || rawJson.trim().isEmpty()) {
            return rawJson;
        }
        try {
            JsonNode rootNode = objectMapper.readTree(rawJson);
            if (!(rootNode instanceof ObjectNode)) {
                return rawJson;
            }
            ObjectNode root = (ObjectNode) rootNode;

            JsonNode subTips = root.path("sub_tips");
            List<ObjectNode> gapsList = new ArrayList<>();

            addCategoryGap(gapsList, "Dinh dang & Bo cuc",
                    root.path("stage2_core").path("ats_format").path("score").asInt(0),
                    12,
                    subTips,
                    new String[]{"ats_parsability", "typography", "length", "file_technical"});

            addCategoryGap(gapsList, "Kha nang doc & Cau truc",
                    root.path("stage2_core").path("professional_foundation").path("score").asInt(0),
                    18,
                    subTips,
                    new String[]{"sections", "organization", "summary", "contact"});

            addCategoryGap(gapsList, "Tu khoa & Chat luong",
                    root.path("stage2_core").path("content_quality").path("score").asInt(0),
                    20,
                    subTips,
                    new String[]{"quantification", "keywords", "language", "consistency"});

            addCategoryGap(gapsList, "Kinh nghiem lam viec",
                    root.path("stage3_in_depth").path("experience_eval").path("score").asInt(0),
                    20,
                    subTips,
                    new String[]{"bullet_quality", "scope_impact", "progression"});

            addCategoryGap(gapsList, "Ky nang chuyen mon",
                    root.path("stage3_in_depth").path("technical_evidence").path("score").asInt(0),
                    10,
                    subTips,
                    new String[]{"technical_evidence"});

            int educationScore = root.path("stage3_in_depth").path("projects").path("score").asInt(0)
                    + root.path("stage3_in_depth").path("certs").path("score").asInt(0);
            addCategoryGap(gapsList, "Hoc van & Du an",
                    educationScore,
                    10,
                    subTips,
                    new String[]{"projects", "certs"});

            addCategoryGap(gapsList, "Diem cong & Hoat dong khac",
                    root.path("stage4_bonus").path("score").asInt(0),
                    10,
                    subTips,
                    new String[]{"leadership", "learning", "international", "awards", "category_specific"});

            gapsList.sort((a, b) -> Integer.compare(b.get("lost").asInt(), a.get("lost").asInt()));

            ArrayNode gapsArray = root.putArray("score_gaps");
            int count = 0;
            for (ObjectNode gap : gapsList) {
                if (gap.get("lost").asInt() > 0) {
                    gapsArray.add(gap);
                    count++;
                    if (count >= 5) {
                        break;
                    }
                }
            }

            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            log.error("Failed to enrich and calculate score gaps: {}", e.getMessage(), e);
            return rawJson;
        }
    }

    private void addCategoryGap(List<ObjectNode> gapsList, String categoryName, int current, int max, JsonNode subTips, String[] tipKeys) {
        int lost = max - current;
        if (lost <= 0) {
            return;
        }

        String tip = null;
        if (subTips != null && !subTips.isMissingNode()) {
            for (String key : tipKeys) {
                JsonNode tipNode = subTips.path(key);
                if (tipNode != null && !tipNode.isMissingNode() && !tipNode.isNull()) {
                    String val = tipNode.asText().trim();
                    if (!val.isEmpty() && !val.equalsIgnoreCase("null")) {
                        tip = val;
                        break;
                    }
                }
            }
        }

        if (tip == null || tip.isEmpty()) {
            tip = "Cap nhat va hoan thien phan thong tin lien quan de dat diem toi da tu may quet ATS.";
        }

        ObjectNode gap = objectMapper.createObjectNode();
        gap.put("section", categoryName);
        gap.put("current", current);
        gap.put("max", max);
        gap.put("lost", lost);
        gap.put("tip", tip);
        gapsList.add(gap);
    }
}
