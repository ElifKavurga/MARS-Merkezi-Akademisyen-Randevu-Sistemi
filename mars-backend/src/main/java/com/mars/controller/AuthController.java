package com.mars.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.auth.LoginRequest;
import com.mars.dto.auth.LoginResponse;
import com.mars.dto.auth.ResetPasswordConfirmRequest;
import com.mars.dto.auth.ResetPasswordRequest;
import com.mars.dto.auth.ResetPasswordResponse;
import com.mars.service.AuthenticationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        // Success body kept as raw DTO for frontend compatibility (not wrapped in ApiResponse).
        return ResponseEntity.ok(authenticationService.login(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ResetPasswordResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authenticationService.resetPassword(request));
    }

    @PostMapping("/reset-password/confirm")
    public ResponseEntity<ResetPasswordResponse> confirmResetPassword(
            @Valid @RequestBody ResetPasswordConfirmRequest request) {
        return ResponseEntity.ok(authenticationService.confirmResetPassword(request));
    }
}
