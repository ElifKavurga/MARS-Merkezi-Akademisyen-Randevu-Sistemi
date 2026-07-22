package com.mars.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.AppointmentRescheduleApproval;
import jakarta.persistence.LockModeType;

public interface AppointmentRescheduleRequestRepository
        extends JpaRepository<AppointmentRescheduleApproval, Integer> {

    Optional<AppointmentRescheduleApproval> findByAppointment_AppointmentIdAndRequestStatus(
            Integer appointmentId, String requestStatus);

    @Query("""
            select r from AppointmentRescheduleApproval r
            join fetch r.appointment a
            join fetch a.student
            join fetch a.staff
            join fetch a.category
            join fetch r.originalSlot
            join fetch r.proposedSlot
            where a.appointmentId = :appointmentId
              and a.student.userId = :studentId
              and r.requestStatus = :status
            """)
    Optional<AppointmentRescheduleApproval> findStudentRequest(
            @Param("appointmentId") Integer appointmentId,
            @Param("studentId") Integer studentId,
            @Param("status") String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select r from AppointmentRescheduleApproval r
            join fetch r.appointment a
            join fetch a.student
            join fetch a.staff
            join fetch a.category
            join fetch r.originalSlot
            join fetch r.proposedSlot
            where r.rescheduleRequestId = :requestId
            """)
    Optional<AppointmentRescheduleApproval> findByIdForUpdate(@Param("requestId") Integer requestId);

    @Query("""
            select case when count(r) > 0 then true else false end
            from AppointmentRescheduleApproval r
            where r.proposedSlot.staff.userId = :staffId
              and r.proposedSlot.slotDate = :slotDate
              and r.proposedSlot.startTime < :endTime
              and r.proposedSlot.endTime > :startTime
              and r.requestStatus = 'PENDING'
              and r.expiresAt > :now
            """)
    boolean existsActiveSlotLock(
            @Param("staffId") Integer staffId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("now") LocalDateTime now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select r from AppointmentRescheduleApproval r
            join fetch r.appointment a
            join fetch a.student
            join fetch a.staff
            join fetch a.category
            join fetch r.originalSlot
            join fetch r.proposedSlot
            where r.requestStatus = 'PENDING' and r.expiresAt <= :now
            """)
    List<AppointmentRescheduleApproval> findExpiredPending(@Param("now") LocalDateTime now);
}
