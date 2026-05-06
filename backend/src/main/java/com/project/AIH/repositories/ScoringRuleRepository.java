package com.project.AIH.repositories;

import com.project.AIH.models.ScoringRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoringRuleRepository extends JpaRepository<ScoringRule, Long> {
}
