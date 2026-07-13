package com.mars.repository;

import com.mars.entity.AppointmentCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentCategoryRepository extends JpaRepository<AppointmentCategory, Integer> {
}
