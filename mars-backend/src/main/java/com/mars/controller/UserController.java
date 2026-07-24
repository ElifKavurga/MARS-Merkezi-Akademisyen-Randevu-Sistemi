package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.UserOptionResponseDto;
import com.mars.dto.user.UpdateProfileRequestDto;
import com.mars.dto.user.UserProfileResponseDto;
import com.mars.security.CustomUserDetails;
import com.mars.service.UserQueryService;
import com.mars.service.UserProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserQueryService userQueryService;
    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<List<UserOptionResponseDto>> getUsers(@RequestParam String role) {
        return ResponseEntity.ok(userQueryService.getActiveUsersByRole(role));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponseDto> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getMyProfile(userDetails.getUser().getUserId()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponseDto> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequestDto request) {
        return ResponseEntity.ok(userProfileService.updateMyProfile(userDetails.getUser().getUserId(), request));
    }
}
