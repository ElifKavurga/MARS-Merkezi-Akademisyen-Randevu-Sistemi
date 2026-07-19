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
        delegationLog.setUpdatedAt(delegatedAt);
        delegationLog.setDelegationStatus(DelegationStatus.PENDING.name());
        return delegationLog;
    }

    public DelegationResponse toResponse(DelegationLog delegationLog) {
        Appointment appointment = delegationLog.getAppointment();
        User delegatedByUser = delegationLog.getDelegatedByUser();
        User delegatedToUser = delegationLog.getDelegatedToUser();

        return DelegationResponse.builder()
                .delegationId(delegationLog.getDelegationId())
                .appointmentId(appointment != null ? appointment.getAppointmentId() : null)
                .delegatedByUserId(delegatedByUser != null ? delegatedByUser.getUserId() : null)
                .delegatedByUserName(delegatedByUser != null ? delegatedByUser.getFullName() : null)
                .delegatedToUserId(delegatedToUser != null ? delegatedToUser.getUserId() : null)
                .delegatedToUserName(delegatedToUser != null ? delegatedToUser.getFullName() : null)
                .delegatedAt(delegationLog.getDelegatedAt())
                .updatedAt(delegationLog.getUpdatedAt())
                .delegationStatus(delegationLog.getDelegationStatus())
                .categoryName(appointment != null && appointment.getCategory() != null
                        ? appointment.getCategory().getCategoryName()
                        : null)
                .courseCode(appointment != null && appointment.getCourse() != null
                        ? appointment.getCourse().getCourseCode()
                        : null)
                .courseName(appointment != null && appointment.getCourse() != null
                        ? appointment.getCourse().getCourseName()
                        : null)
                .appointmentDate(appointment != null && appointment.getSlot() != null
                        ? appointment.getSlot().getSlotDate()
                        : null)
                .startTime(appointment != null && appointment.getSlot() != null
                        ? appointment.getSlot().getStartTime()
                        : null)
                .endTime(appointment != null && appointment.getSlot() != null
                        ? appointment.getSlot().getEndTime()
                        : null)
                .meetingType(appointment != null ? appointment.getMeetingType() : null)
                .build();
    }
}
