package com.project.AIH.repositories;

import com.project.AIH.models.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long>, JpaSpecificationExecutor<InterviewSession> {

    @Query("SELECT s FROM InterviewSession s " +
           "JOIN FETCH s.application a " +
           "JOIN FETCH a.job j " +
           "JOIN FETCH a.resume r " +
           "WHERE r.user.id = :userId " +
           "ORDER BY s.createdAt DESC")
    List<InterviewSession> findByUserId(@Param("userId") Long userId);
}
