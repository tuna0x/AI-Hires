package com.project.AIH.repositories;

import com.project.AIH.models.InterviewInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterviewInsightRepository extends JpaRepository<InterviewInsight, Long> {
}
