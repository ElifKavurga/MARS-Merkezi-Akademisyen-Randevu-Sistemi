package com.mars.repository;

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
            JOIN FETCH d.appointment
            JOIN FETCH d.delegatedByUser
            JOIN FETCH d.delegatedToUser
            WHERE d.delegationId = :delegationId
            """)
    Optional<DelegationLog> findByIdWithDetails(@Param("delegationId") Integer delegationId);
}
