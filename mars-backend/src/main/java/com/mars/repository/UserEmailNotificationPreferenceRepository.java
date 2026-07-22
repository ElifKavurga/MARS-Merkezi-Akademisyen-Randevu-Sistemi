package com.mars.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.mars.entity.UserEmailNotificationPreference;

public interface UserEmailNotificationPreferenceRepository
        extends JpaRepository<UserEmailNotificationPreference, Integer> {
}
