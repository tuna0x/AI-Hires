package com.project.AIH.dto;

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
    private boolean isFinished;
}
