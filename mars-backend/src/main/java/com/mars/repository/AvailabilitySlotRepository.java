package com.mars.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.AvailabilitySlot;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Integer> {

    @Query("""
            SELECT s FROM AvailabilitySlot s
            WHERE s.staff.userId = :staffId
            ORDER BY s.slotDate ASC, s.startTime ASC
            """)
    List<AvailabilitySlot> findByStaffIdOrderBySlotDateAscStartTimeAsc(@Param("staffId") Integer staffId);
}
