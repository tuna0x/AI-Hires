package com.project.AIH.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "scan_actions",
    indexes = {
        @Index(name = "idx_actions_scan_id", columnList = "scan_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_id", nullable = false)
    @ToString.Exclude
    private ResumeScan scan;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String action;

    @Column(length = 20)
    private String priority; // Cao / Trung bình / Thấp

    @Column(name = "sort_order")
    private Integer sortOrder;
}
