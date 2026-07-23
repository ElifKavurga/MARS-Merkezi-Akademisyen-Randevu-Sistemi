package com.mars.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.DelegationLog;

import jakarta.persistence.LockModeType;

public interface DelegationLogRepository extends JpaRepository<DelegationLog, Integer> {

    boolean existsByAppointment_AppointmentIdAndDelegationStatus(
            Integer appointmentId,
            String delegationStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT d
            FROM DelegationLog d
            WHERE d.delegationId = :delegationId
            """)
    Optional<DelegationLog> findByIdForUpdate(@Param("delegationId") Integer delegationId);

    @Query("""
            SELECT d
            FROM DelegationLog d
            JOIN FETCH d.appointment a
            JOIN FETCH a.slot
            JOIN FETCH a.category
            JOIN FETCH a.staff
            LEFT JOIN FETCH a.course
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            WHERE d.delegationId = :delegationId
            """)
    Optional<DelegationLog> findByIdWithDetails(@Param("delegationId") Integer delegationId);

    @Query("""
            SELECT d
            FROM DelegationLog d
            JOIN FETCH d.appointment a
            JOIN FETCH a.slot
            JOIN FETCH a.category
            LEFT JOIN FETCH a.course
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            WHERE d.delegatedToUser.userId = :assistantId
              AND d.delegationStatus = :status
            ORDER BY d.delegatedAt DESC
            """)
    List<DelegationLog> findIncomingByAssistantIdAndStatus(
            @Param("assistantId") Integer assistantId,
            @Param("status") String status);

    @Query("""
            SELECT d
            FROM DelegationLog d
            JOIN FETCH d.appointment a
            JOIN FETCH a.slot
            JOIN FETCH a.category
            LEFT JOIN FETCH a.course
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            WHERE d.delegatedToUser.userId = :targetId
              AND d.delegationStatus IN :statuses
            ORDER BY d.delegatedAt DESC
            """)
    List<DelegationLog> findIncomingByTargetIdAndStatuses(
            @Param("targetId") Integer targetId,
            @Param("statuses") Set<String> statuses);

    List<DelegationLog> findByAppointment_AppointmentIdAndDelegationStatusAndDelegationIdNot(
            Integer appointmentId,
            String delegationStatus,
            Integer delegationId);

    @Query("""
            SELECT d
            FROM DelegationLog d
            JOIN FETCH d.appointment a
            JOIN FETCH a.slot
            JOIN FETCH a.category
            LEFT JOIN FETCH a.course
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            WHERE d.delegatedByUser.userId = :userId
            ORDER BY d.delegatedAt DESC
            """)
    List<DelegationLog> findHistoryByDelegatedByUserId(@Param("userId") Integer userId);

    @Query("""
            SELECT d
            FROM DelegationLog d
            JOIN FETCH d.appointment a
            JOIN FETCH a.slot
            JOIN FETCH a.category
            LEFT JOIN FETCH a.course
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            WHERE d.delegatedToUser.userId = :userId
            ORDER BY d.delegatedAt DESC
            """)
    List<DelegationLog> findHistoryByDelegatedToUserId(@Param("userId") Integer userId);

    @Query("""
            SELECT d
            FROM DelegationLog d
            JOIN FETCH d.appointment a
            JOIN FETCH a.slot
            JOIN FETCH a.category
            JOIN FETCH a.staff
            LEFT JOIN FETCH a.course
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            WHERE a.student.userId = :studentId
            ORDER BY d.delegatedAt DESC
            """)
    List<DelegationLog> findHistoryByStudentId(@Param("studentId") Integer studentId);

    long countByDelegatedByUser_UserIdAndDelegationStatus(Integer userId, String delegationStatus);

    long countByDelegatedToUser_UserIdAndDelegationStatus(Integer userId, String delegationStatus);

    @Query("""
            SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END
            FROM DelegationLog d
            WHERE d.delegatedToUser.userId = :staffId
              AND d.targetSlotDate = :slotDate
              AND d.targetStartTime < :endTime
              AND d.targetEndTime > :startTime
              AND d.slotLockStatus = 'LOCKED'
              AND (
                    d.delegationStatus = 'PENDING_ACADEMICIAN_APPROVAL'
                    OR d.studentApprovalExpiresAt > :now
              )
              AND (:excludedDelegationId IS NULL OR d.delegationId <> :excludedDelegationId)
            """)
    boolean existsActiveSlotLock(
            @Param("staffId") Integer staffId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("now") LocalDateTime now,
            @Param("excludedDelegationId") Integer excludedDelegationId);

    @Query("""
            SELECT d FROM DelegationLog d
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            JOIN FETCH d.appointment a
            JOIN FETCH a.student
            WHERE d.delegationStatus = :status
              AND d.studentApprovalExpiresAt <= :now
            """)
    List<DelegationLog> findExpiredStudentApprovals(
            @Param("status") String status,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT d FROM DelegationLog d
            JOIN FETCH d.appointment a
            JOIN FETCH a.slot
            JOIN FETCH a.category
            JOIN FETCH a.staff
            LEFT JOIN FETCH a.course
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            WHERE a.student.userId = :studentId
              AND d.delegationStatus = :status
            ORDER BY d.delegatedAt DESC
            """)
    List<DelegationLog> findStudentApprovals(
            @Param("studentId") Integer studentId,
            @Param("status") String status);

    @Query("""
            SELECT d
            FROM DelegationLog d
            JOIN FETCH d.appointment a
            WHERE d.delegationStatus = :delegationStatus
              AND a.appointmentStatus IN :appointmentStatuses
            """)
    List<DelegationLog> findAcceptedWithTerminalAppointmentStatus(
            @Param("delegationStatus") String delegationStatus,
            @Param("appointmentStatuses") Set<String> appointmentStatuses);

    List<DelegationLog> findByAppointment_AppointmentIdAndDelegationStatusOrderByUpdatedAtDesc(
            Integer appointmentId,
            String delegationStatus);
}
