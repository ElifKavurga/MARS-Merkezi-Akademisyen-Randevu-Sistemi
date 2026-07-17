package com.mars.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student
            JOIN FETCH a.category
            JOIN FETCH a.slot
            LEFT JOIN FETCH a.course
            WHERE a.staff.userId = :staffId
              AND (:status IS NULL OR a.appointmentStatus = :status)
            """)
    List<Appointment> findAllByStaffIdWithDetails(
            @Param("staffId") Integer staffId,
            @Param("status") String status);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student
            JOIN FETCH a.category
            JOIN FETCH a.slot
            LEFT JOIN FETCH a.course
            WHERE a.appointmentId = :appointmentId
              AND a.staff.userId = :staffId
            """)
    Optional<Appointment> findByIdAndStaffIdWithDetails(
            @Param("appointmentId") Integer appointmentId,
            @Param("staffId") Integer staffId);

    boolean existsByCategory_CategoryId(Integer categoryId);

    boolean existsByCourse_CourseIdAndAppointmentStatusIn(Integer courseId, Collection<String> statuses);

    boolean existsByCourse_CourseIdAndSlot_IsBlockedFalse(Integer courseId);

    boolean existsBySlot_SlotIdAndAppointmentStatusIn(Integer slotId, Collection<String> statuses);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM Appointment a
            WHERE a.slot.staff.userId = :staffId
              AND a.slot.slotDate BETWEEN :startDate AND :endDate
              AND a.appointmentStatus IN :statuses
            """)
    boolean existsActiveAppointmentsForStaffInDateRange(
            @Param("staffId") Integer staffId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") Collection<String> statuses);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM Appointment a
            WHERE a.student.userId = :studentId
              AND a.slot.slotDate = :slotDate
              AND a.slot.startTime < :endTime
              AND a.slot.endTime > :startTime
              AND a.appointmentStatus IN :statuses
            """)
    boolean existsOverlappingActiveAppointmentForStudent(
            @Param("studentId") Integer studentId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") Collection<String> statuses);
}
