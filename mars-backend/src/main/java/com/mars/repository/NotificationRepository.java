package com.mars.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mars.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findTop20ByUser_UserIdOrderByCreatedAtDesc(Integer userId);
    Optional<Notification> findByNotificationIdAndUser_UserId(Integer notificationId, Integer userId);
}
