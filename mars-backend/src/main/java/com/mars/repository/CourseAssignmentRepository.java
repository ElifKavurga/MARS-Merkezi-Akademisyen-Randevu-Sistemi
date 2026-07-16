package com.mars.repository;

import java.util.List;
import java.util.Optional;

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

    @Query("""
            SELECT ca FROM CourseAssignment ca
            JOIN FETCH ca.course c
            JOIN FETCH c.ownerAcademician
            JOIN FETCH ca.assistant
            WHERE ca.courseAssignmentId = :assignmentId
            """)
    Optional<CourseAssignment> findByIdWithCourseAndOwner(@Param("assignmentId") Integer assignmentId);

    boolean existsByCourse_CourseIdAndAssistant_UserId(Integer courseId, Integer assistantId);

    boolean existsByCourse_CourseIdAndAssistant_UserIdAndCourseAssignmentIdNot(
            Integer courseId,
            Integer assistantId,
            Integer courseAssignmentId);

    @Query("""
            SELECT COUNT(ca) FROM CourseAssignment ca
            JOIN ca.assistant a
            WHERE ca.course.courseId = :courseId
              AND a.isActive = true
            """)
    long countActiveAssistantsByCourseId(@Param("courseId") Integer courseId);
}
