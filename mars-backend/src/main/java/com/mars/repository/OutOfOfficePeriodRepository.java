package com.mars.repository;

import com.mars.entity.OutOfOfficePeriod;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutOfOfficePeriodRepository extends JpaRepository<OutOfOfficePeriod, Integer> {
}
