package com.mars.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.EmailNotificationPreferenceResponse;
import com.mars.dto.EmailNotificationPreferenceUpdateRequest;
import com.mars.service.EmailNotificationPreferenceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/email-preferences/me")
@RequiredArgsConstructor
public class EmailNotificationPreferenceController {
    private final EmailNotificationPreferenceService service;

    @GetMapping
    public ResponseEntity<EmailNotificationPreferenceResponse> getMyPreferences() {
        return ResponseEntity.ok(service.getMyPreferences());
    }

    @PutMapping
    public ResponseEntity<EmailNotificationPreferenceResponse> updateMyPreferences(
            @Valid @RequestBody EmailNotificationPreferenceUpdateRequest request) {
        return ResponseEntity.ok(service.updateMyPreferences(request));
    }
}
