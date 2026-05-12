package com.project.AIH.dto;

import lombok.*;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeScanMessage implements Serializable {
    private Long scanId;
    private String storageObjectKey;
    private String contentType;
    private String fileHash;
}
