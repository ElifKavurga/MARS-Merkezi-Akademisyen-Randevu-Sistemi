package com.mars.repository;

import com.mars.entity.RecurrenceRule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecurrenceRuleRepository extends JpaRepository<RecurrenceRule, Integer> {
}
