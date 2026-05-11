package com.project.AIH.models;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanScore {

    private Long id;
    private ResumeScan scan;
    private Integer totalScore;
    private Integer stage2Score;
    private Integer stage3Score;
    private Integer stage4Score;
    private List<String> strengths;
}
