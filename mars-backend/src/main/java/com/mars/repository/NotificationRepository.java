package com.mars.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mars.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findTop20ByUser_UserIdOrderByCreatedAtDesc(Integer userId);
    Page<Notification> findByUser_UserId(Integer userId, Pageable pageable);
    Optional<Notification> findByNotificationIdAndUser_UserId(Integer notificationId, Integer userId);
}
