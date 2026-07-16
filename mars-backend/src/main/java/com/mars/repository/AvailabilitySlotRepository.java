package com.mars.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

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

    @Query("""
            SELECT s FROM AvailabilitySlot s
            JOIN FETCH s.staff
            WHERE s.slotId = :slotId
            """)
    Optional<AvailabilitySlot> findByIdWithStaff(@Param("slotId") Integer slotId);

    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
            FROM AvailabilitySlot s
            WHERE s.staff.userId = :staffId
              AND s.slotDate = :slotDate
              AND s.startTime < :endTime
              AND s.endTime > :startTime
            """)
    boolean existsOverlappingSlot(
            @Param("staffId") Integer staffId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    @Query("""
            SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
            FROM AvailabilitySlot s
            WHERE s.staff.userId = :staffId
              AND s.slotDate = :slotDate
              AND s.startTime < :endTime
              AND s.endTime > :startTime
              AND s.slotId <> :slotId
            """)
    boolean existsOverlappingSlotExcludingId(
            @Param("staffId") Integer staffId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("slotId") Integer slotId);
}
