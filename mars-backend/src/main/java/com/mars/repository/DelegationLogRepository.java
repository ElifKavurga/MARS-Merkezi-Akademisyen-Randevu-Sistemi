package com.mars.repository;

import java.util.List;
import java.util.Optional;

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

    long countByDelegatedByUser_UserIdAndDelegationStatus(Integer userId, String delegationStatus);

    long countByDelegatedToUser_UserIdAndDelegationStatus(Integer userId, String delegationStatus);
}
