package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.mars.dto.NotificationResponse;
import com.mars.dto.NotificationUnreadCountResponse;
import com.mars.dto.PageResponseDto;
import com.mars.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getMyNotifications());
    }

    @GetMapping("/page")
    public ResponseEntity<PageResponseDto<NotificationResponse>> getMyNotificationsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(notificationService.getMyNotifications(page, size));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markMyNotificationAsRead(
            @PathVariable Integer notificationId) {
        return ResponseEntity.ok(notificationService.markMyNotificationAsRead(notificationId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<NotificationUnreadCountResponse> getMyUnreadCount() {
        return ResponseEntity.ok(new NotificationUnreadCountResponse(notificationService.getMyUnreadCount()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<NotificationUnreadCountResponse> markAllMyNotificationsAsRead() {
        notificationService.markAllMyNotificationsAsRead();
        return ResponseEntity.ok(new NotificationUnreadCountResponse(0));
    }
}
