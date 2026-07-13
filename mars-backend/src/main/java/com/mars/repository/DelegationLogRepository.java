package com.mars.repository;

import com.mars.entity.DelegationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DelegationLogRepository extends JpaRepository<DelegationLog, Integer> {
}
