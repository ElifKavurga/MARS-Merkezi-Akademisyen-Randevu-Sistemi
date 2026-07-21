package com.mars.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import com.mars.entity.Appointment;

import jakarta.persistence.LockModeType;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student
            JOIN FETCH a.category
            JOIN FETCH a.slot s
            LEFT JOIN FETCH a.course
            WHERE a.staff.userId = :staffId
              AND s.slotDate BETWEEN :from AND :to
            ORDER BY s.slotDate ASC, s.startTime ASC
            """)
    List<Appointment> findCalendarAppointmentsForStaffInRange(
            @Param("staffId") Integer staffId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student stu
            JOIN FETCH stu.department
            JOIN FETCH a.category
            JOIN FETCH a.slot
            JOIN FETCH a.staff st
            JOIN FETCH st.department
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
            JOIN FETCH a.staff st
            JOIN FETCH st.department
            JOIN FETCH a.category
            JOIN FETCH a.slot s
            LEFT JOIN FETCH a.course
            WHERE a.student.userId = :studentId
              AND a.appointmentStatus IN :statuses
            ORDER BY s.slotDate ASC, s.startTime ASC
            """)
    List<Appointment> findActiveByStudentIdWithDetails(
            @Param("studentId") Integer studentId,
            @Param("statuses") Collection<String> statuses);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.staff st
            JOIN FETCH st.department
            JOIN FETCH a.category
            JOIN FETCH a.slot s
            LEFT JOIN FETCH a.course
            WHERE a.student.userId = :studentId
              AND a.appointmentStatus IN :statuses
            ORDER BY s.slotDate DESC, s.startTime DESC
            """)
    List<Appointment> findPastByStudentIdWithDetails(
            @Param("studentId") Integer studentId,
            @Param("statuses") Collection<String> statuses);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.staff st
            JOIN FETCH st.department
            JOIN FETCH a.category
            JOIN FETCH a.slot
            LEFT JOIN FETCH a.course
            WHERE a.appointmentId = :appointmentId
              AND a.student.userId = :studentId
            """)
    Optional<Appointment> findByIdAndStudentIdWithDetails(
            @Param("appointmentId") Integer appointmentId,
            @Param("studentId") Integer studentId);

    boolean existsByAppointmentId(Integer appointmentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.slot
            WHERE a.appointmentId = :appointmentId
              AND a.student.userId = :studentId
            """)
    Optional<Appointment> findByIdAndStudentIdForUpdate(
            @Param("appointmentId") Integer appointmentId,
            @Param("studentId") Integer studentId);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student stu
            JOIN FETCH stu.department
            JOIN FETCH a.category
            JOIN FETCH a.slot
            JOIN FETCH a.staff st
            JOIN FETCH st.department
            LEFT JOIN FETCH a.course
            WHERE a.appointmentId = :appointmentId
              AND a.staff.userId = :staffId
            """)
    Optional<Appointment> findByIdAndStaffIdWithDetails(
            @Param("appointmentId") Integer appointmentId,
            @Param("staffId") Integer staffId);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.staff
            LEFT JOIN FETCH a.course
            WHERE a.appointmentId = :appointmentId
            """)
    Optional<Appointment> findByIdWithStaffAndCourse(@Param("appointmentId") Integer appointmentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a
            FROM Appointment a
            WHERE a.appointmentId = :appointmentId
              AND a.staff.userId = :staffId
            """)
    Optional<Appointment> findByIdAndStaffIdForUpdate(
            @Param("appointmentId") Integer appointmentId,
            @Param("staffId") Integer staffId);

    long countByStaff_UserIdAndAppointmentStatus(Integer staffId, String appointmentStatus);

    @Query("""
            SELECT COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.userId = :staffId
              AND a.appointmentStatus = :status
              AND (s.slotDate > :today
                   OR (s.slotDate = :today AND s.startTime >= :now))
            """)
    long countUpcomingByStaffIdAndStatus(
            @Param("staffId") Integer staffId,
            @Param("status") String status,
            @Param("today") LocalDate today,
            @Param("now") LocalTime now);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student
            JOIN FETCH a.category
            JOIN FETCH a.slot s
            JOIN FETCH a.staff
            LEFT JOIN FETCH a.course
            WHERE a.staff.userId = :staffId
              AND a.appointmentStatus = :status
            ORDER BY
              CASE WHEN (s.slotDate > :today
                         OR (s.slotDate = :today AND s.startTime >= :now))
                   THEN 0 ELSE 1 END,
              s.slotDate ASC,
              s.startTime ASC
            """)
    List<Appointment> findPendingDashboardPreview(
            @Param("staffId") Integer staffId,
            @Param("status") String status,
            @Param("today") LocalDate today,
            @Param("now") LocalTime now,
            Pageable pageable);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student
            JOIN FETCH a.category
            JOIN FETCH a.slot
            JOIN FETCH a.staff
            LEFT JOIN FETCH a.course
            WHERE a.staff.userId = :staffId
              AND a.appointmentStatus = :status
            ORDER BY a.createdAt DESC
            """)
    List<Appointment> findRecentPendingDashboardPreview(
            @Param("staffId") Integer staffId,
            @Param("status") String status,
            Pageable pageable);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student
            JOIN FETCH a.category
            JOIN FETCH a.slot s
            JOIN FETCH a.staff
            LEFT JOIN FETCH a.course
            WHERE a.staff.userId = :staffId
              AND a.appointmentStatus = :status
              AND (s.slotDate > :today
                   OR (s.slotDate = :today AND s.startTime >= :now))
            ORDER BY s.slotDate ASC, s.startTime ASC
            """)
    List<Appointment> findUpcomingDashboardPreview(
            @Param("staffId") Integer staffId,
            @Param("status") String status,
            @Param("today") LocalDate today,
            @Param("now") LocalTime now,
            Pageable pageable);

    boolean existsByCategory_CategoryId(Integer categoryId);

    boolean existsByCourse_CourseIdAndAppointmentStatusIn(Integer courseId, Collection<String> statuses);

    boolean existsByCourse_CourseIdAndSlot_IsBlockedFalse(Integer courseId);

    boolean existsBySlot_SlotIdAndAppointmentStatusIn(Integer slotId, Collection<String> statuses);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM Appointment a
            WHERE a.slot.slotId = :slotId
              AND a.appointmentId <> :appointmentId
              AND a.appointmentStatus IN :statuses
            """)
    boolean existsActiveAppointmentForSlotExcludingAppointment(
            @Param("slotId") Integer slotId,
            @Param("appointmentId") Integer appointmentId,
            @Param("statuses") Collection<String> statuses);

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

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM Appointment a
            WHERE a.student.userId = :studentId
              AND a.appointmentId <> :appointmentId
              AND a.slot.slotDate = :slotDate
              AND a.slot.startTime < :endTime
              AND a.slot.endTime > :startTime
              AND a.appointmentStatus IN :statuses
            """)
    boolean existsOverlappingActiveAppointmentForStudentExcludingAppointment(
            @Param("studentId") Integer studentId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("appointmentId") Integer appointmentId,
            @Param("statuses") Collection<String> statuses);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM Appointment a
            WHERE a.staff.userId = :staffId
              AND a.slot.slotDate = :slotDate
              AND a.slot.startTime < :endTime
              AND a.slot.endTime > :startTime
              AND a.appointmentStatus IN :statuses
            """)
    boolean existsOverlappingActiveAppointmentForStaff(
            @Param("staffId") Integer staffId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") Collection<String> statuses);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM Appointment a
            WHERE a.staff.userId = :staffId
              AND a.appointmentId <> :appointmentId
              AND a.slot.slotDate = :slotDate
              AND a.slot.startTime < :endTime
              AND a.slot.endTime > :startTime
              AND a.appointmentStatus IN :statuses
            """)
    boolean existsOverlappingActiveAppointmentForStaffExcludingAppointment(
            @Param("staffId") Integer staffId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("appointmentId") Integer appointmentId,
            @Param("statuses") Collection<String> statuses);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.slot s
            WHERE a.staff.userId = :staffId
              AND s.slotDate BETWEEN :from AND :to
              AND a.appointmentStatus IN :statuses
            """)
    List<Appointment> findActiveAppointmentsForStaffInDateRange(
            @Param("staffId") Integer staffId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("statuses") Collection<String> statuses);
}
