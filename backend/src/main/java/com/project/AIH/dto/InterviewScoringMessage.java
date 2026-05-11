package com.project.AIH.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewScoringMessage implements Serializable {
    private Long answerId;
    private Long sessionId;
    private String questionText;
    private String answerText;
    private String targetRole;
    private String industry;
    private String level;
}
