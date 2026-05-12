package com.project.AIH.dto;

import com.project.AIH.models.InterviewReport;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewReportResponseDTO {
    private String status; // "PROCESSING" or "COMPLETED"
    private InterviewReport report;
}
