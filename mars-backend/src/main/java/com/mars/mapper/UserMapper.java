package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.admin.UpdateUserRequest;
import com.mars.dto.admin.UserListResponse;
import com.mars.dto.admin.UserResponse;
import com.mars.dto.UserOptionResponseDto;
import com.mars.entity.Department;
import com.mars.entity.Role;
import com.mars.entity.User;

@Component
public class UserMapper {

    public UserListResponse toUserListResponse(User user) {
        return UserListResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .institutionalEmail(user.getInstitutionalEmail())
                .role(user.getRole().getRoleName())
                .department(user.getDepartment().getDepartmentName())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserOptionResponseDto toUserOptionResponse(User user) {
        return UserOptionResponseDto.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .institutionalEmail(user.getInstitutionalEmail())
                .departmentName(user.getDepartment().getDepartmentName())
                .build();
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .institutionalEmail(user.getInstitutionalEmail())
                .role(user.getRole().getRoleName())
                .department(user.getDepartment().getDepartmentName())
                .isActive(user.getIsActive())
                .build();
    }

    public void updateUserFromRequest(User user, UpdateUserRequest request, Role role, Department department) {
        user.setFullName(request.getFullName());
        user.setInstitutionalEmail(request.getInstitutionalEmail());
        user.setRole(role);
        user.setDepartment(department);
    }
}
