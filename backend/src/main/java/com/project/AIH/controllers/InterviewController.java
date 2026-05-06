package com.project.AIH.controllers;

import com.project.AIH.dto.InterviewSubmitAnswerResponseDTO;
import com.project.AIH.models.InterviewQuestion;
import com.project.AIH.models.InterviewSession;
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
    public ResponseEntity<InterviewSession> startInterview(@RequestBody Map<String, Long> request) {
        Long applicationId = request.get("applicationId");
        return ResponseEntity.ok(interviewService.startSession(applicationId));
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
}
