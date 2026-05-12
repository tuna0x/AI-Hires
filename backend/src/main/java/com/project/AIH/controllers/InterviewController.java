package com.project.AIH.controllers;

import com.project.AIH.dto.InterviewSubmitAnswerResponseDTO;
import com.project.AIH.models.InterviewQuestion;
import com.project.AIH.models.InterviewSession;
import com.project.AIH.models.InterviewReport;
import com.project.AIH.models.User;
import com.project.AIH.services.InterviewService;
import com.project.AIH.services.UserService;
import com.project.AIH.services.ResumeParserService;
import com.project.AIH.utils.SecurityUtil;
import com.project.AIH.utils.annotation.ApiMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import com.turkraft.springfilter.boot.Filter;
import com.project.AIH.dto.ResultPaginationDTO;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final UserService userService;
    private final ResumeParserService resumeParserService;

    @PostMapping("/extract-text")
    @ApiMessage("Extract text from file successfully")
    public ResponseEntity<Map<String, String>> extractText(@RequestParam("file") MultipartFile file) {
        try {
            String text = resumeParserService.extractText(file.getInputStream());
            return ResponseEntity.ok(Map.of("text", text));
        } catch (Exception e) {
            throw new RuntimeException("Không thể trích xuất văn bản từ tệp tin JD: " + e.getMessage(), e);
        }
    }

    @PostMapping("/start")
    public ResponseEntity<InterviewSession> startInterview(@RequestBody Map<String, Object> request) {
        Long applicationId = Long.valueOf(request.get("applicationId").toString());
        String targetLevel = request.containsKey("targetLevel") ? (String) request.get("targetLevel") : null;
        return ResponseEntity.ok(interviewService.startSession(applicationId, targetLevel));
    }

    @PostMapping("/start-mock")
    public ResponseEntity<InterviewSession> startMockInterview(@RequestBody Map<String, Object> request) {
        Long resumeId = Long.valueOf(request.get("resumeId").toString());
        String targetRole = (String) request.get("targetRole");
        String jobDescription = (String) request.get("jobDescription");
        String targetLevel = request.containsKey("targetLevel") ? (String) request.get("targetLevel") : null;
        return ResponseEntity.ok(interviewService.startMockSession(resumeId, targetRole, jobDescription, targetLevel));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<InterviewSession> getSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.getSession(sessionId));
    }

    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<InterviewSubmitAnswerResponseDTO> submitAnswer(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String headerIdempotencyKey) {
        String answer = request.get("answer");
        String bodyIdempotencyKey = request.get("idempotencyKey");
        String idempotencyKey = (bodyIdempotencyKey != null && !bodyIdempotencyKey.trim().isEmpty()) 
                ? bodyIdempotencyKey : headerIdempotencyKey;
        return ResponseEntity.ok(interviewService.submitAnswer(sessionId, answer, idempotencyKey));
    }

    @PostMapping("/{sessionId}/finish")
    public ResponseEntity<InterviewSession> finishInterview(@PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.finishSession(sessionId));
    }

    @GetMapping("/{sessionId}/questions")
    public ResponseEntity<List<InterviewQuestion>> getQuestions(@PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.getVisibleQuestions(sessionId));
    }

    @GetMapping("/{sessionId}/scores")
    public ResponseEntity<Map<String, Object>> getScoreStatus(@PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.getScoreStatuses(sessionId));
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<com.project.AIH.dto.InterviewReportResponseDTO> getReport(@PathVariable Long sessionId) {
        java.util.Optional<InterviewReport> reportOpt = interviewService.getReportBySessionId(sessionId);
        if (reportOpt.isPresent()) {
            return ResponseEntity.ok(com.project.AIH.dto.InterviewReportResponseDTO.builder()
                    .status("COMPLETED")
                    .report(reportOpt.get())
                    .build());
        }
        return ResponseEntity.ok(com.project.AIH.dto.InterviewReportResponseDTO.builder()
                .status("PROCESSING")
                .report(null)
                .build());
    }

    @GetMapping("/my-sessions")
    @ApiMessage("Fetch user's mock interview sessions successfully")
    public ResponseEntity<ResultPaginationDTO> getMySessions(
            @Filter Specification<InterviewSession> spec,
            Pageable pageable
    ) {
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("Bạn cần đăng nhập để thực hiện chức năng này"));

        User user = userService.fetchUserByEmail(email);
        if (user == null) {
            throw new RuntimeException("Người dùng không tồn tại");
        }

        ResultPaginationDTO sessions = interviewService.getSessionsByUser(spec, pageable, user);
        return ResponseEntity.ok(sessions);
    }
}
