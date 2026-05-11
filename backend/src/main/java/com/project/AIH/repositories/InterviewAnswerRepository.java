package com.project.AIH.repositories;

import com.project.AIH.models.InterviewAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, Long> {
    java.util.Optional<InterviewAnswer> findByIdempotencyKey(String idempotencyKey);

    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM interview_answers ia " +
                   "JOIN interview_questions iq ON ia.question_id = iq.id " +
                   "WHERE iq.session_id = :sessionId AND NOT EXISTS (" +
                   "    SELECT 1 FROM interview_evaluations ie WHERE ie.answer_id = ia.id" +
                   ")", nativeQuery = true)
    long countPendingEvaluationsNative(@org.springframework.data.repository.query.Param("sessionId") Long sessionId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM interview_answers ia " +
                   "JOIN interview_questions iq ON ia.question_id = iq.id " +
                   "WHERE iq.session_id = :sessionId", nativeQuery = true)
    long countTotalAnswersNative(@org.springframework.data.repository.query.Param("sessionId") Long sessionId);
}
