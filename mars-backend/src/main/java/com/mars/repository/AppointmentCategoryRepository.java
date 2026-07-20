package com.mars.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.AppointmentCategory;

public interface AppointmentCategoryRepository extends JpaRepository<AppointmentCategory, Integer> {

    List<AppointmentCategory> findAllByOrderByCategoryIdAsc();

    boolean existsByCategoryName(String categoryName);

    boolean existsByCategoryNameAndCategoryIdNot(String categoryName, Integer categoryId);
}
