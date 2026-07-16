package com.mars.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.RecurrenceRule;

public interface RecurrenceRuleRepository extends JpaRepository<RecurrenceRule, Integer> {

    @Query("""
            SELECT r FROM RecurrenceRule r
            JOIN FETCH r.staff
            WHERE r.recurrenceRuleId = :recurrenceRuleId
            """)
    Optional<RecurrenceRule> findByIdWithStaff(@Param("recurrenceRuleId") Integer recurrenceRuleId);
}
