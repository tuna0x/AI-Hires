package com.project.AIH.repositories;

import com.project.AIH.models.OutboxMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface OutboxMessageRepository extends JpaRepository<OutboxMessage, Long> {
    List<OutboxMessage> findByStatusOrderByCreatedAtAsc(String status);
    List<OutboxMessage> findTop50ByStatusOrderByCreatedAtAsc(String status);

    @Modifying
    @Transactional
    @Query("""
            update OutboxMessage msg
               set msg.status = :nextStatus
             where msg.id = :id
               and msg.status = :currentStatus
            """)
    int claimStatus(@Param("id") Long id,
                    @Param("currentStatus") String currentStatus,
                    @Param("nextStatus") String nextStatus);
}
