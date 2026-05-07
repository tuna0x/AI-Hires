package com.project.AIH.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project.AIH.models.*;
import com.project.AIH.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanMapperService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private final ResumeScanRepository resumeScanRepository;
    private final ScanScoreRepository scanScoreRepository;
    private final ScanSubScoreRepository scanSubScoreRepository;
    private final ScanActionRepository scanActionRepository;

    @Transactional
    public ResumeScan saveScanResult(User user, String fileName, String fileHash, String rawJson) {
        try {
            // Parse JSON String
            JsonNode root = objectMapper.readTree(rawJson);

            // 1. Create ResumeScan (Parent)
            ResumeScan scan = ResumeScan.builder()
                    .user(user)
                    .fileName(fileName)
                    .fileHash(fileHash)
                    .scannedAt(Instant.now())
                    .build();

            // Extract stage1_detection info
            JsonNode detection = root.path("stage1_detection");
            if (detection != null && !detection.isMissingNode()) {
                scan.setCandidateName(detection.path("name").asText(""));
                scan.setLevel(detection.path("level").asText(""));
                scan.setIndustry(detection.path("industry").asText(""));
            }

            // Save parent first to obtain ID
            scan = resumeScanRepository.save(scan);

            // 2. Extract and Save ScanScore (Summary & Strengths)
            int totalScore = root.path("total_score").asInt(0);
            int stage2Score = root.path("stage2_core").path("score").asInt(0);
            int stage3Score = root.path("stage3_in_depth").path("score").asInt(0);
            int stage4Score = root.path("stage4_bonus").path("score").asInt(0);

            List<String> strengths = new ArrayList<>();
            JsonNode strengthsNode = root.path("strengths");
            if (strengthsNode != null && strengthsNode.isArray()) {
                for (JsonNode s : strengthsNode) {
                    strengths.add(s.asText());
                }
            }

            ScanScore scanScore = ScanScore.builder()
                    .scan(scan)
                    .totalScore(totalScore)
                    .stage2Score(stage2Score)
                    .stage3Score(stage3Score)
                    .stage4Score(stage4Score)
                    .strengths(strengths)
                    .build();

            scanScoreRepository.save(scanScore);
            scan.setScoreSummary(scanScore);

            // 3. Extract sub_tips Map
            Map<String, String> tipsMap = new HashMap<>();
            JsonNode tipsNode = root.path("sub_tips");
            if (tipsNode != null && !tipsNode.isMissingNode()) {
                Iterator<Map.Entry<String, JsonNode>> fields = tipsNode.fields();
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> field = fields.next();
                    if (field.getValue() != null && !field.getValue().isNull()) {
                        tipsMap.put(field.getKey(), field.getValue().asText());
                    }
                }
            }

            // 4. Extract and Save ScanSubScores (Criteria detailed lines)
            List<ScanSubScore> subScores = new ArrayList<>();

            // Giai đoạn 2 - Core Criteria
            extractCategorySubScores(scan, root.path("stage2_core").path("ats_format"), "ats_format",
                    new String[]{"file_technical", "ats_parsability", "typography", "length"}, tipsMap, subScores);
            
            extractCategorySubScores(scan, root.path("stage2_core").path("professional_foundation"), "professional_foundation",
                    new String[]{"contact", "summary", "sections", "organization"}, tipsMap, subScores);

            extractCategorySubScores(scan, root.path("stage2_core").path("content_quality"), "content_quality",
                    new String[]{"language", "quantification", "keywords", "consistency"}, tipsMap, subScores);

            // Giai đoạn 3 - In-Depth Criteria
            extractCategorySubScores(scan, root.path("stage3_in_depth").path("experience_eval"), "experience_eval",
                    new String[]{"progression", "bullet_quality", "scope_impact"}, tipsMap, subScores);

            extractCategorySubScores(scan, root.path("stage3_in_depth").path("technical_evidence"), "technical_evidence",
                    new String[]{"technical_evidence"}, tipsMap, subScores);

            extractCategorySubScores(scan, root.path("stage3_in_depth").path("projects"), "projects",
                    new String[]{"projects"}, tipsMap, subScores);

            extractCategorySubScores(scan, root.path("stage3_in_depth").path("certs"), "certs",
                    new String[]{"certs"}, tipsMap, subScores);

            // Giai đoạn 4 - Bonus Criteria
            extractCategorySubScores(scan, root.path("stage4_bonus"), "stage4_bonus",
                    new String[]{"leadership", "international", "awards", "learning", "category_specific"}, tipsMap, subScores);

            scanSubScoreRepository.saveAll(subScores);
            scan.setSubScores(subScores);

            // 5. Extract and Save ScanActions
            List<ScanAction> actions = new ArrayList<>();
            JsonNode actionsNode = root.path("priority_actions");
            if (actionsNode != null && actionsNode.isArray()) {
                int index = 0;
                for (JsonNode actionNode : actionsNode) {
                    ScanAction scanAction = ScanAction.builder()
                            .scan(scan)
                            .action(actionNode.path("action").asText(""))
                            .priority(actionNode.path("priority").asText("Trung bình"))
                            .sortOrder(index++)
                            .build();
                    actions.add(scanAction);
                }
            }
            scanActionRepository.saveAll(actions);
            scan.setActions(actions);

            return scan;

        } catch (Exception e) {
            log.error("Failed to map Gemini JSON to structured tables: {}", e.getMessage(), e);
            throw new RuntimeException("Database structuring failed", e);
        }
    }

    private void extractCategorySubScores(ResumeScan scan, JsonNode categoryNode, String categoryName, 
                                          String[] keys, Map<String, String> tipsMap, List<ScanSubScore> subScores) {
        if (categoryNode == null || categoryNode.isMissingNode()) return;

        JsonNode detailsNode = categoryNode.path("details");
        if (detailsNode != null && detailsNode.isArray()) {
            for (int i = 0; i < detailsNode.size(); i++) {
                String detailText = detailsNode.get(i).asText();
                String sectionKey = (i < keys.length) ? keys[i] : (categoryName + "_item_" + i);

                int[] parsed = parseScores(detailText);
                int score = parsed[0];
                int maxScore = parsed[1];
                int lostPoints = maxScore - score;

                // Build sub score entity
                ScanSubScore sub = ScanSubScore.builder()
                        .scan(scan)
                        .sectionKey(sectionKey)
                        .score(score)
                        .maxScore(maxScore)
                        .lostPoints(lostPoints)
                        .details(Collections.singletonList(detailText))
                        .tip(tipsMap.get(sectionKey))
                        .build();

                subScores.add(sub);
            }
        }
    }

    private int[] parseScores(String text) {
        Pattern p = Pattern.compile("\\+(\\d+)/(\\d+)");
        Matcher m = p.matcher(text);
        if (m.find()) {
            return new int[]{Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2))};
        }
        return new int[]{0, 0};
    }

    @Transactional(readOnly = true)
    public String reconstructJson(ResumeScan scan) {
        try {
            ObjectNode root = objectMapper.createObjectNode();

            // Populate base properties
            ScanScore scoreSummary = scan.getScoreSummary();
            root.put("total_score", scoreSummary != null ? scoreSummary.getTotalScore() : 0);

            // stage1_detection
            ObjectNode detection = root.putObject("stage1_detection");
            detection.put("name", scan.getCandidateName());
            detection.put("level", scan.getLevel());
            detection.put("industry", scan.getIndustry());

            // Build map of category scores and details
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

            // stage2_core
            ObjectNode stage2 = root.putObject("stage2_core");
            stage2.put("score", scoreSummary != null ? scoreSummary.getStage2Score() : 0);
            
            populateCategoryNode(stage2, "ats_format", detailsMap, categoryScores);
            populateCategoryNode(stage2, "professional_foundation", detailsMap, categoryScores);
            populateCategoryNode(stage2, "content_quality", detailsMap, categoryScores);

            // stage3_in_depth
            ObjectNode stage3 = root.putObject("stage3_in_depth");
            stage3.put("score", scoreSummary != null ? scoreSummary.getStage3Score() : 0);

            populateCategoryNode(stage3, "experience_eval", detailsMap, categoryScores);
            populateCategoryNode(stage3, "technical_evidence", detailsMap, categoryScores);
            populateCategoryNode(stage3, "projects", detailsMap, categoryScores);
            populateCategoryNode(stage3, "certs", detailsMap, categoryScores);

            // stage4_bonus
            ObjectNode stage4 = stage3.putObject("stage4_bonus"); // note stage4 is inside stage3 in frontend parsing
            stage4.put("score", scoreSummary != null ? scoreSummary.getStage4Score() : 0);
            ArrayNode bonusDetails = stage4.putArray("details");
            if (detailsMap.containsKey("stage4_bonus")) {
                for (String d : detailsMap.get("stage4_bonus")) {
                    bonusDetails.add(d);
                }
            }

            // strengths
            ArrayNode strengthsNode = root.putArray("strengths");
            if (scoreSummary != null && scoreSummary.getStrengths() != null) {
                for (String strength : scoreSummary.getStrengths()) {
                    strengthsNode.add(strength);
                }
            }

            // priority_actions
            ArrayNode actionsNode = root.putArray("priority_actions");
            if (scan.getActions() != null) {
                scan.getActions().stream()
                        .sorted(Comparator.comparing(ScanAction::getSortOrder))
                        .forEach(action -> {
                            ObjectNode actionObj = actionsNode.addObject();
                            actionObj.put("action", action.getAction());
                            actionObj.put("priority", action.getPriority());
                        });
            }

            // sub_tips
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

            // score_gaps
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
            for (String d : detailsMap.get(categoryName)) {
                details.add(d);
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

    private String getHumanReadableSectionName(String key) {
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

            // 1. Get sub_tips
            JsonNode subTips = root.path("sub_tips");

            // 2. Define Category configurations
            List<ObjectNode> gapsList = new ArrayList<>();

            addCategoryGap(gapsList, "Định dạng & Bố cục", 
                    root.path("stage2_core").path("ats_format").path("score").asInt(0), 
                    20, 
                    subTips, 
                    new String[]{"ats_parsability", "typography", "length", "file_technical"});

            addCategoryGap(gapsList, "Khả năng đọc & Cấu trúc", 
                    root.path("stage2_core").path("professional_foundation").path("score").asInt(0), 
                    20, 
                    subTips, 
                    new String[]{"sections", "organization", "summary", "contact"});

            addCategoryGap(gapsList, "Từ khóa & Chất lượng", 
                    root.path("stage2_core").path("content_quality").path("score").asInt(0), 
                    20, 
                    subTips, 
                    new String[]{"quantification", "keywords", "language", "consistency"});

            addCategoryGap(gapsList, "Kinh nghiệm làm việc", 
                    root.path("stage3_in_depth").path("experience_eval").path("score").asInt(0), 
                    15, 
                    subTips, 
                    new String[]{"bullet_quality", "scope_impact", "progression"});

            addCategoryGap(gapsList, "Kỹ năng chuyên môn", 
                    root.path("stage3_in_depth").path("technical_evidence").path("score").asInt(0), 
                    8, 
                    subTips, 
                    new String[]{"technical_evidence"});

            int educationScore = root.path("stage3_in_depth").path("projects").path("score").asInt(0) 
                    + root.path("stage3_in_depth").path("certs").path("score").asInt(0);
            addCategoryGap(gapsList, "Học vấn & Dự án", 
                    educationScore, 
                    7, 
                    subTips, 
                    new String[]{"projects", "certs"});

            addCategoryGap(gapsList, "Điểm cộng & Hoạt động khác", 
                    root.path("stage4_bonus").path("score").asInt(0), 
                    10, 
                    subTips, 
                    new String[]{"leadership", "learning", "international", "awards", "category_specific"});

            // 3. Filter lost > 0 and sort descending by lost
            gapsList.sort((a, b) -> Integer.compare(b.get("lost").asInt(), a.get("lost").asInt()));

            // Limit to 5 gaps
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

        // Find the first non-null, non-empty tip from subTips
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
            // Fallback generic tips based on category
            switch (categoryName) {
                case "Định dạng & Bố cục":
                    tip = "Đảm bảo sử dụng các tiêu đề mục chuẩn (Education, Experience) và định dạng lề, cỡ chữ đồng đều.";
                    break;
                case "Khả năng đọc & Cấu trúc":
                    tip = "Bổ sung đầy đủ thông tin liên hệ chuyên nghiệp (LinkedIn, GitHub) và viết tóm tắt mục tiêu nghề nghiệp súc tích.";
                    break;
                case "Từ khóa & Chất lượng":
                    tip = "Bổ sung thêm các số liệu định lượng (%, $) và từ khóa chuyên ngành khớp với bản mô tả công việc (JD).";
                    break;
                case "Kinh nghiệm làm việc":
                    tip = "Viết lại các gạch đầu dòng mô tả công việc theo mô hình STAR (Hành động đi kèm kết quả đo lường được).";
                    break;
                case "Kỹ năng chuyên môn":
                    tip = "Phân loại rõ ràng các nhóm kỹ năng công nghệ và cung cấp các minh chứng thực tế trong các dự án của bạn.";
                    break;
                case "Học vấn & Dự án":
                    tip = "Mô tả chi tiết các dự án nổi bật (vai trò, công nghệ sử dụng, kết quả) và bổ sung các chứng chỉ liên quan.";
                    break;
                case "Điểm cộng & Hoạt động khác":
                    tip = "Bổ sung thêm các thông tin về khả năng ngoại ngữ, hoạt động tự học công nghệ mới hoặc kinh nghiệm dẫn dắt đội nhóm.";
                    break;
                default:
                    tip = "Cập nhật và hoàn thiện phần thông tin liên quan để đạt điểm tối đa từ máy quét ATS.";
            }
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
