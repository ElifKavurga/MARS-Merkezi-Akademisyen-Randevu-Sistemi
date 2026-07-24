package com.mars.mapper;

import org.springframework.stereotype.Component;
import com.mars.dto.EmailNotificationPreferenceResponse;
import com.mars.dto.EmailNotificationPreferenceUpdateRequest;
import com.mars.entity.UserEmailNotificationPreference;

@Component
public class EmailNotificationPreferenceMapper {
    public EmailNotificationPreferenceResponse toResponse(UserEmailNotificationPreference value) {
        return new EmailNotificationPreferenceResponse(
                value.getAppointmentRequest(), value.getAppointmentApproval(), value.getAppointmentRejection(),
                value.getAppointmentCancellation(), value.getReschedule(), value.getDelegation(),
                value.getAppointmentReminder(), value.getWaitlist(), value.getNoShow(), value.getPenalty(), value.getSystemAnnouncements());
    }

    public void update(UserEmailNotificationPreference value, EmailNotificationPreferenceUpdateRequest request) {
        value.setAppointmentRequest(request.appointmentRequest());
        value.setAppointmentApproval(request.appointmentApproval());
        value.setAppointmentRejection(request.appointmentRejection());
        value.setAppointmentCancellation(request.appointmentCancellation());
        value.setReschedule(request.reschedule());
        value.setDelegation(request.delegation());
        value.setAppointmentReminder(request.appointmentReminder());
        value.setWaitlist(request.waitlist());
        value.setNoShow(request.noShow());
        value.setPenalty(request.penalty());
        value.setSystemAnnouncements(request.systemAnnouncements());
    }
}
