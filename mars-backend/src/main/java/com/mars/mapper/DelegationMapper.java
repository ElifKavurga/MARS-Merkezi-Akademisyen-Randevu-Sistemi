package com.mars.mapper;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.mars.dto.DelegationResponse;
import com.mars.entity.Appointment;
import com.mars.entity.DelegationLog;
import com.mars.entity.User;
import com.mars.enums.DelegationStatus;

@Component
public class DelegationMapper {

    public DelegationLog toEntity(
            Appointment appointment,
            User delegatedByUser,
            User delegatedToUser,
            LocalDateTime delegatedAt) {
        DelegationLog delegationLog = new DelegationLog();
        delegationLog.setAppointment(appointment);
        delegationLog.setDelegatedByUser(delegatedByUser);
        delegationLog.setDelegatedToUser(delegatedToUser);
        delegationLog.setDelegatedAt(delegatedAt);
        delegationLog.setDelegationStatus(DelegationStatus.PENDING.name());
        return delegationLog;
    }

    public DelegationResponse toResponse(DelegationLog delegationLog) {
        return DelegationResponse.builder()
                .delegationId(delegationLog.getDelegationId())
                .appointmentId(delegationLog.getAppointment() != null
                        ? delegationLog.getAppointment().getAppointmentId()
                        : null)
                .delegatedByUserId(delegationLog.getDelegatedByUser() != null
                        ? delegationLog.getDelegatedByUser().getUserId()
                        : null)
                .delegatedToUserId(delegationLog.getDelegatedToUser() != null
                        ? delegationLog.getDelegatedToUser().getUserId()
                        : null)
                .delegatedAt(delegationLog.getDelegatedAt())
                .delegationStatus(delegationLog.getDelegationStatus())
                .build();
    }
}
