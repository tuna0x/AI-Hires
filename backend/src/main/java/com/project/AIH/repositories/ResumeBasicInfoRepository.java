package com.project.AIH.repositories;

import com.project.AIH.models.ResumeBasicInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResumeBasicInfoRepository extends JpaRepository<ResumeBasicInfo, Long> {
}
