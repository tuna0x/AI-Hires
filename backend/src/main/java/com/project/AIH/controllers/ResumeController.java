package com.project.AIH.controllers;

import com.project.AIH.models.Application;
import com.project.AIH.models.Resume;
import com.project.AIH.models.User;
import com.project.AIH.services.ResumeService;
import com.project.AIH.services.UserService;
import com.project.AIH.utils.SecurityUtil;
import com.project.AIH.utils.annotation.ApiMessage;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import com.turkraft.springfilter.boot.Filter;
import com.project.AIH.dto.ResultPaginationDTO;
import java.util.List;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
@Slf4j
public class ResumeController {

    private final ResumeService resumeService;
    private final UserService userService;

    @PostMapping("/apply")
    @ApiMessage("Apply for job and get AI score successfully")
    public ResponseEntity<Application> apply(@RequestParam("file") MultipartFile file,
            @RequestParam("jobId") Long jobId) {
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("Bạn cần đăng nhập để thực hiện chức năng này"));

        User user = userService.fetchUserByEmail(email);
        if (user == null) {
            throw new RuntimeException("Người dùng không tồn tại");
        }

        Application application = resumeService.applyAndScore(file, jobId, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(application);
    }

    @PostMapping("/upload")
    @ApiMessage("Upload and parse resume successfully")
    public ResponseEntity<com.project.AIH.models.Resume> upload(@RequestParam("file") MultipartFile file) {
        String email = SecurityUtil.getCurrentUserLogin().orElse(null);
        User user = null;
        if (email != null) {
            user = userService.fetchUserByEmail(email);
        }

        com.project.AIH.models.Resume resume = resumeService.uploadAndParse(file, user);
        log.info("Resume upload response status: {} for resume ID: {}", resume.getParseStatus(), resume.getId());
        
        if (resume.getParseStatus() == com.project.AIH.utils.constant.ResumeStatusEnum.PROCESSING) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(resume);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(resume);
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch resume details successfully")
    public ResponseEntity<com.project.AIH.models.Resume> getResumeDetails(@PathVariable("id") Long id) {
        com.project.AIH.models.Resume resume = resumeService.getResumeById(id);
        return ResponseEntity.ok(resume);
    }

    @GetMapping("/my-resumes")
    @ApiMessage("Fetch user's resumes successfully")
    public ResponseEntity<ResultPaginationDTO> getMyResumes(
            @Filter Specification<Resume> spec,
            Pageable pageable
    ) {
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("Bạn cần đăng nhập để thực hiện chức năng này"));

        User user = userService.fetchUserByEmail(email);
        if (user == null) {
            throw new RuntimeException("Người dùng không tồn tại");
        }

        ResultPaginationDTO resumes = resumeService.getResumesByUser(spec, pageable, user);
        return ResponseEntity.ok(resumes);
    }

    @Data
    public static class FeedbackRequestDTO {
        private Integer userRating;
        private String userFeedback;
    }

    @PostMapping("/scan/{scanId}/feedback")
    @ApiMessage("Submit feedback for resume scan successfully")
    public ResponseEntity<Void> submitScanFeedback(
            @PathVariable("scanId") Long scanId,
            @RequestBody FeedbackRequestDTO feedbackRequest
    ) {
        String email = SecurityUtil.getCurrentUserLogin().orElse(null);
        User user = null;
        if (email != null) {
            user = userService.fetchUserByEmail(email);
        }

        resumeService.submitScanFeedback(scanId, feedbackRequest.getUserRating(), feedbackRequest.getUserFeedback(), user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/application/{applicationId}/feedback")
    @ApiMessage("Submit feedback for application CV scoring successfully")
    public ResponseEntity<Void> submitApplicationFeedback(
            @PathVariable("applicationId") Long applicationId,
            @RequestBody FeedbackRequestDTO feedbackRequest
    ) {
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("Bạn cần đăng nhập để thực hiện chức năng này"));

        User user = userService.fetchUserByEmail(email);
        if (user == null) {
            throw new RuntimeException("Người dùng không tồn tại");
        }

        resumeService.submitApplicationFeedback(applicationId, feedbackRequest.getUserRating(), feedbackRequest.getUserFeedback(), user);
        return ResponseEntity.ok().build();
    }
}
