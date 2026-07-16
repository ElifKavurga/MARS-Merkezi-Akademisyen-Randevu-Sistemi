package com.mars.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.Course;

public interface CourseRepository extends JpaRepository<Course, Integer> {

    List<Course> findByOwnerAcademician_UserIdOrderByCourseNameAsc(Integer userId);
}
