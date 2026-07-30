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
            JOIN FETCH a.staff
            JOIN FETCH a.category
            JOIN FETCH a.slot s
            LEFT JOIN FETCH a.course
            WHERE a.appointmentStatus = :status
              AND s.slotDate BETWEEN :fromDate AND :toDate
            ORDER BY s.slotDate ASC, s.startTime ASC
            """)
    List<Appointment> findReminderCandidates(
            @Param("status") String status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

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

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student stu
            JOIN FETCH a.category
            JOIN FETCH a.slot s
            LEFT JOIN FETCH a.course
            WHERE a.staff.userId = :staffId
            ORDER BY s.slotDate DESC, s.startTime DESC
            """)
    List<Appointment> findRecentByStaffIdWithDetails(
            @Param("staffId") Integer staffId,
            Pageable pageable);

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.student
            JOIN FETCH a.staff
            JOIN FETCH a.category
            JOIN FETCH a.slot
            LEFT JOIN FETCH a.course
            WHERE a.appointmentId = :appointmentId
            """)
    Optional<Appointment> findByIdForUpdate(@Param("appointmentId") Integer appointmentId);

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

    long countByStudent_UserIdAndAppointmentStatus(Integer studentId, String appointmentStatus);

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

    @Query("""
            SELECT a.appointmentId
            FROM Appointment a
            JOIN a.slot s
            WHERE a.appointmentStatus IN :statuses
              AND (s.slotDate < :cutoffDate OR (s.slotDate = :cutoffDate AND s.endTime <= :cutoffTime))
            """)
    List<Integer> findStatusUpdateCandidateIds(
            @Param("statuses") Collection<String> statuses,
            @Param("cutoffDate") LocalDate cutoffDate,
            @Param("cutoffTime") LocalTime cutoffTime,
            Pageable pageable);

    long countByStaff_UserId(Integer staffId);

    long countByStaff_UserIdAndSlot_SlotDate(Integer staffId, LocalDate slotDate);

    /**
     * Count appointments per status for a given staff member.
     * Returns Object[] pairs: [appointmentStatus, count]
     */
    @Query("""
            SELECT a.appointmentStatus, COUNT(a)
            FROM Appointment a
            WHERE a.staff.userId = :staffId
            GROUP BY a.appointmentStatus
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByStatusForStaff(@Param("staffId") Integer staffId);

    /**
     * Count appointments per category for a given staff member.
     * Returns Object[] pairs: [categoryName, count]
     */
    @Query("""
            SELECT a.category.categoryName, COUNT(a)
            FROM Appointment a
            WHERE a.staff.userId = :staffId
            GROUP BY a.category.categoryName
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByCategoryForStaff(@Param("staffId") Integer staffId);

    /**
     * Count appointments per slot date for the given staff, within a date range.
     * Returns Object[] pairs: [slotDate (LocalDate), count]
     */
    @Query("""
            SELECT a.slot.slotDate, COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.userId = :staffId
              AND s.slotDate BETWEEN :from AND :to
            GROUP BY a.slot.slotDate
            ORDER BY a.slot.slotDate ASC
            """)
    List<Object[]> countByDayForStaffInRange(
            @Param("staffId") Integer staffId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * Count appointments per year-month for a given staff member, within a date range.
     * Returns Object[] pairs: [year (Integer), month (Integer), count]
     */
    @Query("""
            SELECT YEAR(s.slotDate), MONTH(s.slotDate), COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.userId = :staffId
              AND s.slotDate BETWEEN :from AND :to
            GROUP BY YEAR(s.slotDate), MONTH(s.slotDate)
            ORDER BY YEAR(s.slotDate) ASC, MONTH(s.slotDate) ASC
            """)
    List<Object[]> countByMonthForStaffInRange(
            @Param("staffId") Integer staffId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
    long countByStaff_Department_DepartmentId(Integer departmentId);

    long countByStaff_Department_DepartmentIdAndSlot_SlotDate(Integer departmentId, LocalDate slotDate);

    long countByStaff_Department_DepartmentIdAndAppointmentStatus(Integer departmentId, String appointmentStatus);

    /**
     * Count appointments per status for a given department.
     * Returns Object[] pairs: [appointmentStatus, count]
     */
    @Query("""
            SELECT a.appointmentStatus, COUNT(a)
            FROM Appointment a
            WHERE a.staff.department.departmentId = :departmentId
            GROUP BY a.appointmentStatus
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByStatusForDepartment(@Param("departmentId") Integer departmentId);

    /**
     * Count appointments per category for a given department.
     * Returns Object[] pairs: [categoryName, count]
     */
    @Query("""
            SELECT a.category.categoryName, COUNT(a)
            FROM Appointment a
            WHERE a.staff.department.departmentId = :departmentId
            GROUP BY a.category.categoryName
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByCategoryForDepartment(@Param("departmentId") Integer departmentId);

    /**
     * Count appointments per slot date for the department, within a date range.
     * Returns Object[] pairs: [slotDate (LocalDate), count]
     */
    @Query("""
            SELECT a.slot.slotDate, COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.department.departmentId = :departmentId
              AND s.slotDate BETWEEN :from AND :to
            GROUP BY a.slot.slotDate
            ORDER BY a.slot.slotDate ASC
            """)
    List<Object[]> countByDayForDepartmentInRange(
            @Param("departmentId") Integer departmentId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            SELECT YEAR(s.slotDate), MONTH(s.slotDate), COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.department.departmentId = :departmentId
              AND s.slotDate BETWEEN :from AND :to
            GROUP BY YEAR(s.slotDate), MONTH(s.slotDate)
            ORDER BY YEAR(s.slotDate) ASC, MONTH(s.slotDate) ASC
            """)
    List<Object[]> countByMonthForDepartmentInRange(
            @Param("departmentId") Integer departmentId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            SELECT s.slotDate, COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.department.departmentId = :departmentId
              AND a.appointmentStatus = :status
            GROUP BY s.slotDate
            """)
    List<Object[]> countBySlotDateAndStatusForDepartment(
            @Param("departmentId") Integer departmentId,
            @Param("status") String status);

    @Query("""
            SELECT s.startTime, COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.department.departmentId = :departmentId
              AND a.appointmentStatus = :status
            GROUP BY s.startTime
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByStartTimeAndStatusForDepartment(
            @Param("departmentId") Integer departmentId,
            @Param("status") String status);

    @Query("""
            SELECT a.staff.fullName, COUNT(a)
            FROM Appointment a
            WHERE a.staff.department.departmentId = :departmentId
            GROUP BY a.staff.userId, a.staff.fullName
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByStaffForDepartment(
            @Param("departmentId") Integer departmentId);

    @Query("""
            SELECT s.slotDate, COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.department.departmentId = :departmentId
            GROUP BY s.slotDate
            """)
    List<Object[]> countBySlotDateForDepartment(
            @Param("departmentId") Integer departmentId);

    @Query("""
            SELECT s.startTime, COUNT(a)
            FROM Appointment a
            JOIN a.slot s
            WHERE a.staff.department.departmentId = :departmentId
            GROUP BY s.startTime
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByStartTimeForDepartment(
            @Param("departmentId") Integer departmentId);
}
