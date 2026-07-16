package com.mars.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.CourseAssignment;

public interface CourseAssignmentRepository extends JpaRepository<CourseAssignment, Integer> {

    @Query("""
            SELECT ca FROM CourseAssignment ca
            JOIN FETCH ca.assistant a
            JOIN FETCH a.department
            WHERE ca.course.courseId = :courseId
              AND a.isActive = true
            ORDER BY a.fullName ASC
            """)
    List<CourseAssignment> findActiveAssistantsByCourseId(@Param("courseId") Integer courseId);
}
