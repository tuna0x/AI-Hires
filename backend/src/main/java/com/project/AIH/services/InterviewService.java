package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.models.Application;
import com.project.AIH.models.InterviewMessage;
import com.project.AIH.models.InterviewSession;
import com.project.AIH.repositories.ApplicationRepository;
import com.project.AIH.repositories.InterviewMessageRepository;
import com.project.AIH.repositories.InterviewSessionRepository;
import com.project.AIH.utils.constant.InterviewMessageRoleEnum;
import com.project.AIH.utils.constant.InterviewSessionStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewMessageRepository messageRepository;
    private final ApplicationRepository applicationRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Transactional
    public InterviewSession startSession(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        InterviewSession session = InterviewSession.builder()
                .application(application)
                .status(InterviewSessionStatusEnum.IN_PROGRESS)
                .build();
        session = sessionRepository.save(session);

        String jobDesc = application.getJob().getDescription();
        String cvText = application.getResume().getExtractedText();

        String initialQuestion = geminiService.generateInitialQuestion(jobDesc, cvText);

        InterviewMessage aiMessage = InterviewMessage.builder()
                .interviewSession(session)
                .role(InterviewMessageRoleEnum.AI)
                .content(initialQuestion)
                .build();
        messageRepository.save(aiMessage);

        return session;
    }

    @Transactional
    public InterviewMessage submitAnswer(Long sessionId, String answerText) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != InterviewSessionStatusEnum.IN_PROGRESS) {
            throw new RuntimeException("Interview session is already finished");
        }

        // 1. Save candidate answer
        InterviewMessage candidateMessage = InterviewMessage.builder()
                .interviewSession(session)
                .role(InterviewMessageRoleEnum.CANDIDATE)
                .content(answerText)
                .build();
        messageRepository.save(candidateMessage);

        // 2. Fetch history
        String chatHistory = getChatHistory(sessionId);
        String jobDesc = session.getApplication().getJob().getDescription();

        // 3. Evaluate and generate next question
        String aiResponse = geminiService.evaluateAndGenerateNextQuestion(jobDesc, chatHistory, answerText);
        
        try {
            JsonNode resultNode = objectMapper.readTree(aiResponse);
            int score = resultNode.path("score").asInt();
            String feedback = resultNode.path("feedback").asText();
            String nextQuestion = resultNode.path("next_question").asText();

            // Update candidate message with score and feedback
            candidateMessage.setScore(score);
            candidateMessage.setFeedback(feedback);
            messageRepository.save(candidateMessage);

            // Save AI next question
            InterviewMessage aiNextMessage = InterviewMessage.builder()
                    .interviewSession(session)
                    .role(InterviewMessageRoleEnum.AI)
                    .content(nextQuestion)
                    .build();
            return messageRepository.save(aiNextMessage);

        } catch (Exception e) {
            log.error("Failed to parse Gemini evaluation response: {}", e.getMessage());
            throw new RuntimeException("Error evaluating answer");
        }
    }

    @Transactional
    public InterviewSession finishSession(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        String chatHistory = getChatHistory(sessionId);
        String jobDesc = session.getApplication().getJob().getDescription();

        String aiResponse = geminiService.generateFinalReport(jobDesc, chatHistory);

        try {
            JsonNode resultNode = objectMapper.readTree(aiResponse);
            int finalScore = resultNode.path("final_score").asInt();
            
            session.setFinalReport(aiResponse);
            session.setFinalScore(finalScore);
            session.setStatus(InterviewSessionStatusEnum.COMPLETED);
            session.setEndTime(Instant.now());
            
            return sessionRepository.save(session);
        } catch (Exception e) {
            log.error("Failed to parse Gemini final report response: {}", e.getMessage());
            throw new RuntimeException("Error generating final report");
        }
    }

    public List<InterviewMessage> getSessionMessages(Long sessionId) {
        return messageRepository.findByInterviewSessionIdOrderByCreatedAtAsc(sessionId);
    }

    private String getChatHistory(Long sessionId) {
        List<InterviewMessage> messages = messageRepository.findByInterviewSessionIdOrderByCreatedAtAsc(sessionId);
        StringBuilder sb = new StringBuilder();
        for (InterviewMessage msg : messages) {
            sb.append(msg.getRole().name()).append(": ").append(msg.getContent()).append("\n");
        }
        return sb.toString();
    }
}
