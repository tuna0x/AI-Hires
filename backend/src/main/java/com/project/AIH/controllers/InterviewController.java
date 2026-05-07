package com.project.AIH.controllers;

import com.project.AIH.dto.InterviewSubmitAnswerResponseDTO;
import com.project.AIH.models.InterviewQuestion;
import com.project.AIH.models.InterviewSession;
import com.project.AIH.models.InterviewReport;
import com.project.AIH.services.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

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
            @RequestBody Map<String, String> request) {
        String answer = request.get("answer");
        return ResponseEntity.ok(interviewService.submitAnswer(sessionId, answer));
    }

    @PostMapping("/{sessionId}/finish")
    public ResponseEntity<InterviewSession> finishInterview(@PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.finishSession(sessionId));
    }

    @GetMapping("/{sessionId}/questions")
    public ResponseEntity<List<InterviewQuestion>> getQuestions(@PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.getSessionQuestions(sessionId));
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<InterviewReport> getReport(@PathVariable Long sessionId) {
        return interviewService.getReportBySessionId(sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
