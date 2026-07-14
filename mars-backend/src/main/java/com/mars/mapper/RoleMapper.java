package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.RoleResponseDto;
import com.mars.entity.Role;

@Component
public class RoleMapper {

    public RoleResponseDto toResponse(Role role) {
        return RoleResponseDto.builder()
                .roleId(role.getRoleId())
                .roleName(role.getRoleName())
                .build();
    }
}
