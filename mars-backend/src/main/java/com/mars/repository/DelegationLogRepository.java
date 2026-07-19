package com.mars.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.DelegationLog;

public interface DelegationLogRepository extends JpaRepository<DelegationLog, Integer> {

    boolean existsByAppointment_AppointmentIdAndDelegationStatus(
            Integer appointmentId,
            String delegationStatus);

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
}
