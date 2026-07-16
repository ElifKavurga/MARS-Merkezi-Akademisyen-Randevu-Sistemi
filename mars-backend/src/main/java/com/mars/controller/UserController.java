package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.UserOptionResponseDto;
import com.mars.service.UserQueryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserQueryService userQueryService;

    @GetMapping
    public ResponseEntity<List<UserOptionResponseDto>> getUsers(@RequestParam String role) {
        return ResponseEntity.ok(userQueryService.getActiveUsersByRole(role));
    }
}
