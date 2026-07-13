package com.mars.repository;

import com.mars.entity.CourseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseAssignmentRepository extends JpaRepository<CourseAssignment, Integer> {
}
