package com.project.AIH.repositories;

import com.project.AIH.models.InterviewTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewTemplateRepository extends JpaRepository<InterviewTemplate, Long> {
    List<InterviewTemplate> findByUserId(Long userId);
}
