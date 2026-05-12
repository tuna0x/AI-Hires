package com.project.AIH.dto;

import com.project.AIH.utils.constant.ResumeScanStatusEnum;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeScanResultDTO {
    private Long id;
    private ResumeScanStatusEnum status;
    private String fileName;
    private Instant createdAt;
    private Instant completedAt;
    private String candidateName;
    private String level;
    private String industry;
    private Integer totalScore;
    private Integer stage2Score;
    private Integer stage3Score;
    private Integer stage4Score;
    private List<String> strengths;
    private List<PriorityActionDTO> priorityActions;
    private List<ScoreGapDTO> scoreGaps;
    private List<SubScoreDTO> subScores;
    private String failureCode;
    private String failureMessage;
    private Map<String, Object> rawGeminiData;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriorityActionDTO {
        private String action;
        private String priority;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreGapDTO {
        private String section;
        private Integer current;
        private Integer max;
        private Integer lost;
        private String tip;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubScoreDTO {
        private String sectionKey;
        private Integer score;
        private Integer maxScore;
        private Integer lostPoints;
        private List<String> details;
        private String tip;
    }
}
