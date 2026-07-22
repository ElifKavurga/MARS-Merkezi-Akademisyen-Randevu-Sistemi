package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.dto.EmailNotificationPreferenceUpdateRequest;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.entity.UserEmailNotificationPreference;
import com.mars.enums.NotificationType;
import com.mars.mapper.EmailNotificationPreferenceMapper;
import com.mars.repository.UserEmailNotificationPreferenceRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class EmailNotificationPreferenceServiceTest {
    @Mock private UserEmailNotificationPreferenceRepository repository;
    @Spy private final EmailNotificationPreferenceMapper mapper = new EmailNotificationPreferenceMapper();
    @InjectMocks private EmailNotificationPreferenceService service;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void missingPreference_createsAllEnabledDefaultsForCurrentUser() {
        User user = authenticate(7);
        when(repository.findById(7)).thenReturn(Optional.empty());
        when(repository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.getMyPreferences();

        assertThat(response.appointmentRequest()).isTrue();
        assertThat(response.appointmentReminder()).isTrue();
        assertThat(response.penalty()).isTrue();
        verify(repository).save(org.mockito.ArgumentMatchers.argThat(value -> value.getUser() == user));
    }

    @Test
    void disabledAppointmentApproval_blocksOnlyThatEmailCategory() {
        UserEmailNotificationPreference preference = new UserEmailNotificationPreference();
        preference.setAppointmentApproval(false);
        when(repository.findById(7)).thenReturn(Optional.of(preference));

        assertThat(service.isEnabled(7, NotificationType.APPOINTMENT_APPROVED)).isFalse();
        assertThat(service.isEnabled(7, NotificationType.APPOINTMENT_REJECTED)).isTrue();
    }

    @Test
    void updateMyPreferences_updatesCurrentUsersSingleRecord() {
        authenticate(7);
        UserEmailNotificationPreference preference = new UserEmailNotificationPreference();
        when(repository.findById(7)).thenReturn(Optional.of(preference));
        when(repository.save(preference)).thenReturn(preference);
        var request = new EmailNotificationPreferenceUpdateRequest(
                false, true, true, true, true, true, false, true, true, true);

        var response = service.updateMyPreferences(request);

        assertThat(response.appointmentRequest()).isFalse();
        assertThat(response.appointmentReminder()).isFalse();
        verify(repository).save(preference);
    }

    private User authenticate(Integer id) {
        User user = new User();
        user.setUserId(id);
        Role role = new Role();
        role.setRoleName("STUDENT");
        user.setRole(role);
        CustomUserDetails details = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
        return user;
    }
}
