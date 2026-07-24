package com.mars.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.EmailNotificationPreferenceResponse;
import com.mars.dto.EmailNotificationPreferenceUpdateRequest;
import com.mars.entity.User;
import com.mars.entity.UserEmailNotificationPreference;
import com.mars.enums.EmailNotificationCategory;
import com.mars.enums.NotificationType;
import com.mars.mapper.EmailNotificationPreferenceMapper;
import com.mars.repository.UserEmailNotificationPreferenceRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailNotificationPreferenceService {
    private final UserEmailNotificationPreferenceRepository repository;
    private final com.mars.repository.UserRepository userRepository;
    private final EmailNotificationPreferenceMapper mapper;

    @Transactional
    public EmailNotificationPreferenceResponse getMyPreferences() {
        return mapper.toResponse(getOrCreate(getCurrentUser()));
    }

    @Transactional
    public EmailNotificationPreferenceResponse updateMyPreferences(EmailNotificationPreferenceUpdateRequest request) {
        UserEmailNotificationPreference preference = getOrCreate(getCurrentUser());
        mapper.update(preference, request);
        return mapper.toResponse(repository.save(preference));
    }

    @Transactional(readOnly = true)
    public boolean isEnabled(Integer userId, NotificationType notificationType) {
        EmailNotificationCategory category = category(notificationType);
        return repository.findById(userId).map(value -> enabled(value, category)).orElse(true);
    }

    @Transactional(readOnly = true)
    public boolean isReminderEnabled(Integer userId) {
        return repository.findById(userId).map(UserEmailNotificationPreference::getAppointmentReminder).orElse(true);
    }

    private UserEmailNotificationPreference getOrCreate(User user) {
        return repository.findById(user.getUserId()).orElseGet(() -> {
            UserEmailNotificationPreference preference = new UserEmailNotificationPreference();
            preference.setUser(userRepository.getReferenceById(user.getUserId()));
            return repository.save(preference);
        });
    }

    private EmailNotificationCategory category(NotificationType type) {
        return switch (type) {
            case NEW_APPOINTMENT_REQUEST -> EmailNotificationCategory.APPOINTMENT_REQUEST;
            case APPOINTMENT_APPROVED -> EmailNotificationCategory.APPOINTMENT_APPROVAL;
            case APPOINTMENT_REJECTED -> EmailNotificationCategory.APPOINTMENT_REJECTION;
            case APPOINTMENT_CANCELLED -> EmailNotificationCategory.APPOINTMENT_CANCELLATION;
            case APPOINTMENT_RESCHEDULED, APPOINTMENT_RESCHEDULE_REQUESTED,
                    APPOINTMENT_RESCHEDULE_REJECTED, APPOINTMENT_RESCHEDULE_EXPIRED ->
                    EmailNotificationCategory.RESCHEDULE;
            case DELEGATION_REQUEST, DELEGATION_ACCEPTED, DELEGATION_REJECTED,
                    STUDENT_APPROVAL_PENDING, DELEGATION_EXPIRED -> EmailNotificationCategory.DELEGATION;
            case WAITLIST_ADDED, WAITLIST_TURN_AVAILABLE, WAITLIST_REMOVED, WAITLIST_CANCELLED ->
                    EmailNotificationCategory.WAITLIST;
            case NO_SHOW_RECORDED -> EmailNotificationCategory.NO_SHOW;
            case PENALTY_APPLIED, PENALTY_LIFTED -> EmailNotificationCategory.PENALTY;
        };
    }

    private boolean enabled(UserEmailNotificationPreference value, EmailNotificationCategory category) {
        return switch (category) {
            case APPOINTMENT_REQUEST -> value.getAppointmentRequest();
            case APPOINTMENT_APPROVAL -> value.getAppointmentApproval();
            case APPOINTMENT_REJECTION -> value.getAppointmentRejection();
            case APPOINTMENT_CANCELLATION -> value.getAppointmentCancellation();
            case RESCHEDULE -> value.getReschedule();
            case DELEGATION -> value.getDelegation();
            case APPOINTMENT_REMINDER -> value.getAppointmentReminder();
            case WAITLIST -> value.getWaitlist();
            case NO_SHOW -> value.getNoShow();
            case PENALTY -> value.getPenalty();
            case SYSTEM_ANNOUNCEMENT -> value.getSystemAnnouncements();
        };
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails details)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return details.getUser();
    }
}
