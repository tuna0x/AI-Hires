package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;
import com.project.AIH.utils.JsonStringListConverter;
import java.util.List;

@Entity
@Table(name = "scan_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanScore {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "scan_id")
    @ToString.Exclude
    private ResumeScan scan;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "stage2_score")
    private Integer stage2Score;

    @Column(name = "stage3_score")
    private Integer stage3Score;

    @Column(name = "stage4_score")
    private Integer stage4Score;

    @Convert(converter = JsonStringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> strengths;
}
