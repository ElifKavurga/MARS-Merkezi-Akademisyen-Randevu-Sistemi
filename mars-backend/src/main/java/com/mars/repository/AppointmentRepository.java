package com.mars.repository;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    boolean existsByCategory_CategoryId(Integer categoryId);

    boolean existsByCourse_CourseIdAndAppointmentStatusIn(Integer courseId, Collection<String> statuses);

    boolean existsByCourse_CourseIdAndSlot_IsBlockedFalse(Integer courseId);
}
