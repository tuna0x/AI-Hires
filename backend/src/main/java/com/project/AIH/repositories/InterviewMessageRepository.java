package com.project.AIH.repositories;

import com.project.AIH.models.InterviewMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewMessageRepository extends JpaRepository<InterviewMessage, Long> {
    List<InterviewMessage> findByInterviewSessionIdOrderByCreatedAtAsc(Long sessionId);
}
