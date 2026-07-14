package com.mars.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.PenaltyRule;

public interface PenaltyRuleRepository extends JpaRepository<PenaltyRule, Integer> {

    Optional<PenaltyRule> findFirstByOrderByPenaltyRuleIdAsc();
}

