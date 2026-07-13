package com.mars.repository;

import com.mars.entity.StudentPenaltyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentPenaltyStatusRepository extends JpaRepository<StudentPenaltyStatus, Integer> {
}
