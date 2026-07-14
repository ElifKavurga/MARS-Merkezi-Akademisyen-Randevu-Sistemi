package com.mars.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    boolean existsByCategory_CategoryId(Integer categoryId);
}
