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
public class CvScoringMessage implements Serializable {
    private Long applicationId;
    private Long resumeId;
    private Long jobId;
    private String fileUrl; // Path in MinIO
    private String contentType;
}
