package com.project.AIH.repositories;

import com.project.AIH.models.AnswerScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnswerScoreRepository extends JpaRepository<AnswerScore, Long> {
}
