package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.admin.UserListResponse;
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
}
