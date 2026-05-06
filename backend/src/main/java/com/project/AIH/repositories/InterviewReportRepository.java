package com.project.AIH.repositories;

import com.project.AIH.models.InterviewReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterviewReportRepository extends JpaRepository<InterviewReport, Long> {
}
