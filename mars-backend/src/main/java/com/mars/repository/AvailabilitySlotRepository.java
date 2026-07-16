package com.mars.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.AvailabilitySlot;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Integer> {

    @Query("""
            SELECT s FROM AvailabilitySlot s
            LEFT JOIN FETCH s.recurrenceRule
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
            SELECT s FROM AvailabilitySlot s
            JOIN FETCH s.staff
            LEFT JOIN FETCH s.recurrenceRule
            WHERE s.slotId = :slotId
            """)
    Optional<AvailabilitySlot> findByIdWithStaffAndRecurrenceRule(@Param("slotId") Integer slotId);

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

    long countByStaff_UserId(Integer staffId);

    long countByStaff_UserIdAndIsBlocked(Integer staffId, Boolean isBlocked);

    long countByStaff_UserIdAndSlotDateBetween(Integer staffId, LocalDate startInclusive, LocalDate endInclusive);

    List<AvailabilitySlot> findByRecurrenceRule_RecurrenceRuleId(Integer recurrenceRuleId);

    List<AvailabilitySlot> findByStaff_UserIdAndSlotDateBetween(
            Integer staffId, LocalDate startInclusive, LocalDate endInclusive);

    @Query("""
            SELECT s FROM AvailabilitySlot s
            JOIN FETCH s.staff
            WHERE s.staff.userId = :staffId
              AND s.isBlocked = false
              AND s.slotDate >= :today
              AND NOT EXISTS (
                  SELECT 1 FROM Appointment a
                  WHERE a.slot.slotId = s.slotId
                    AND a.appointmentStatus IN :statuses
              )
            ORDER BY s.slotDate ASC, s.startTime ASC
            """)
    List<AvailabilitySlot> findAvailableSlotsForStaff(
            @Param("staffId") Integer staffId,
            @Param("today") LocalDate today,
            @Param("statuses") Collection<String> statuses);

    @Query("""
            SELECT s FROM AvailabilitySlot s
            LEFT JOIN FETCH s.recurrenceRule
            WHERE s.staff.userId = :staffId
              AND (
                (s.recurrenceRule IS NULL AND s.slotDate BETWEEN :from AND :to)
                OR (s.recurrenceRule IS NOT NULL
                    AND s.recurrenceRule.startDate <= :to
                    AND s.recurrenceRule.endDate >= :from)
              )
            ORDER BY s.slotDate ASC, s.startTime ASC
            """)
    List<AvailabilitySlot> findCalendarSlotsForStaffInRange(
            @Param("staffId") Integer staffId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
