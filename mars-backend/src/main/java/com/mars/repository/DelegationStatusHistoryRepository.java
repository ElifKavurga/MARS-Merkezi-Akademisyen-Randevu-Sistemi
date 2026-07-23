package com.mars.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.DelegationStatusHistory;

public interface DelegationStatusHistoryRepository
        extends JpaRepository<DelegationStatusHistory, Integer> {
    List<DelegationStatusHistory> findByDelegation_DelegationIdOrderByChangedAtAsc(Integer delegationId);
}
