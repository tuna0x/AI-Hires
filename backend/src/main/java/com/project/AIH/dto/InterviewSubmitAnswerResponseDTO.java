package com.project.AIH.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.project.AIH.models.InterviewEvaluation;
import com.project.AIH.models.InterviewQuestion;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSubmitAnswerResponseDTO {
    private InterviewEvaluation evaluation;
    private InterviewQuestion nextQuestion;
    
    @JsonProperty("isFinished")
    private boolean isFinished;
}
