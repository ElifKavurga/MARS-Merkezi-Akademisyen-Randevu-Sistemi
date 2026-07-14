package com.mars.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.AppointmentCategory;

public interface AppointmentCategoryRepository extends JpaRepository<AppointmentCategory, Integer> {

    boolean existsByCategoryName(String categoryName);

    boolean existsByCategoryNameAndCategoryIdNot(String categoryName, Integer categoryId);
}
