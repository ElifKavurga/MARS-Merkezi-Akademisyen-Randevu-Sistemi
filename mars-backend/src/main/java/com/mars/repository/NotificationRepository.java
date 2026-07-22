package com.mars.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

import com.mars.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    @EntityGraph(attributePaths = {"user", "relatedAppointment", "relatedDelegation"})
    List<Notification> findTop20ByUser_UserIdOrderByCreatedAtDesc(Integer userId);
    @EntityGraph(attributePaths = {"user", "relatedAppointment", "relatedDelegation"})
    Page<Notification> findByUser_UserId(Integer userId, Pageable pageable);
    @EntityGraph(attributePaths = {"user", "relatedAppointment", "relatedDelegation"})
    Optional<Notification> findByNotificationIdAndUser_UserId(Integer notificationId, Integer userId);
    @EntityGraph(attributePaths = {"user", "relatedAppointment", "relatedDelegation"})
    Optional<Notification> findByUser_UserIdAndEventKey(Integer userId, String eventKey);
    long countByUser_UserIdAndIsReadFalse(Integer userId);

    /** Maintenance seam for a future archive/delete policy; no cleanup is scheduled today. */
    Page<Notification> findByCreatedAtBefore(java.time.LocalDateTime cutoff, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.isRead = true where n.user.userId = :userId and n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Integer userId);
}
