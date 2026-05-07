package com.project.AIH.repositories;

import com.project.AIH.models.InterviewQuestionBank;
import com.project.AIH.utils.constant.DifficultyLevelEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface InterviewQuestionBankRepository extends JpaRepository<InterviewQuestionBank, Long> {
    Optional<InterviewQuestionBank> findByJobIdAndDifficultyAndQuestionOrder(Long jobId, DifficultyLevelEnum difficulty, Integer questionOrder);
}
