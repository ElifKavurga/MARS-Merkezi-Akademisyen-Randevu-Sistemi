package com.mars.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.user.ChangePasswordRequest;
import com.mars.dto.user.UserProfileResponseDto;
import com.mars.entity.User;
import com.mars.exception.BadRequestException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponseDto getMyProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));
        return mapToDto(user);
    }

    @Transactional
    public void changeMyPassword(Integer userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mevcut şifre hatalı.");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BadRequestException("Yeni şifre ve tekrarı eşleşmiyor.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserProfileResponseDto mapToDto(User user) {
        return UserProfileResponseDto.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .institutionalEmail(user.getInstitutionalEmail())
                .role(user.getRole().getRoleName())
                .department(user.getDepartment().getDepartmentName())
                .academicTitle(user.getAcademicTitle())
                .isActive(user.getIsActive())
                .build();
    }
}
