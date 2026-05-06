package com.project.AIH.repositories;

import com.project.AIH.models.InterviewAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, Long> {
}
