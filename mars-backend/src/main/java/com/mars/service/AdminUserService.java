package com.mars.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.admin.CreateUserRequest;
import com.mars.dto.admin.UserListResponse;
import com.mars.dto.admin.UserResponse;
import com.mars.entity.Department;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.UserMapper;
import com.mars.repository.DepartmentRepository;
import com.mars.repository.RoleRepository;
import com.mars.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserListResponse> getAllUsers() {
        return userRepository.findAllWithRoleAndDepartment().stream()
                .map(userMapper::toUserListResponse)
                .toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByInstitutionalEmail(request.getInstitutionalEmail())) {
            throw new ConflictException("Bu e-posta adresi zaten kayıtlı.");
        }

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Rol bulunamadı."));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Bölüm bulunamadı."));

        User user = new User();
        user.setFullName(request.getFullName());
        user.setInstitutionalEmail(request.getInstitutionalEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setDepartment(department);
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return userMapper.toUserResponse(saved);
    }
}
