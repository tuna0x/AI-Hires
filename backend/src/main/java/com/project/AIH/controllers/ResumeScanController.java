package com.project.AIH.controllers;

import com.project.AIH.dto.ResumeScanResultDTO;
import com.project.AIH.models.User;
import com.project.AIH.services.ResumeScanService;
import com.project.AIH.services.UserService;
import com.project.AIH.utils.SecurityUtil;
import com.project.AIH.utils.annotation.ApiMessage;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/resume-scans")
@RequiredArgsConstructor
public class ResumeScanController {

    private final ResumeScanService resumeScanService;
    private final UserService userService;

    @PostMapping
    @ApiMessage("Upload and scan resume successfully")
    public ResponseEntity<ResumeScanResultDTO> createScan(@RequestParam("file") MultipartFile file) {
        ResumeScanResultDTO result = resumeScanService.createScan(file, resolveCurrentUser());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(result);
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch resume scan result successfully")
    public ResponseEntity<ResumeScanResultDTO> getScan(@PathVariable("id") Long id) {
        return ResponseEntity.ok(resumeScanService.getScanResult(id, resolveCurrentUser()));
    }

    @Data
    public static class FeedbackRequestDTO {
        private Integer userRating;
        private String userFeedback;
    }

    @PostMapping("/{id}/feedback")
    @ApiMessage("Submit feedback for resume scan successfully")
    public ResponseEntity<Void> submitFeedback(
            @PathVariable("id") Long id,
            @RequestBody FeedbackRequestDTO feedbackRequest
    ) {
        resumeScanService.submitFeedback(id, feedbackRequest.getUserRating(), feedbackRequest.getUserFeedback(), resolveCurrentUser());
        return ResponseEntity.ok().build();
    }

    private User resolveCurrentUser() {
        String email = SecurityUtil.getCurrentUserLogin().orElse(null);
        if (email == null) {
            return null;
        }
        return userService.fetchUserByEmail(email);
    }
}
