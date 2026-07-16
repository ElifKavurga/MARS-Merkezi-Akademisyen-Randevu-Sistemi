package com.mars.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.UserOptionResponseDto;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.mapper.UserMapper;
import com.mars.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserQueryService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public List<UserOptionResponseDto> getActiveUsersByRole(String role) {
        if (role == null || role.isBlank()) {
            throw new BadRequestException("Rol parametresi zorunludur.");
        }

        String normalizedRole = role.trim().toUpperCase(Locale.ROOT);
        if (!RoleType.ASSISTANT.name().equals(normalizedRole)
                && !RoleType.ACADEMICIAN.name().equals(normalizedRole)
                && !RoleType.HOD.name().equals(normalizedRole)) {
            throw new BadRequestException("Geçersiz rol parametresi.");
        }

        return userRepository.findActiveUsersByRoleName(normalizedRole).stream()
                .map(userMapper::toUserOptionResponse)
                .toList();
    }
}
