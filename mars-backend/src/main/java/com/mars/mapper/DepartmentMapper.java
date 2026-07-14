package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.DepartmentResponseDto;
import com.mars.entity.Department;

@Component
public class DepartmentMapper {

    public DepartmentResponseDto toResponse(Department department) {
        return DepartmentResponseDto.builder()
                .departmentId(department.getDepartmentId())
                .departmentName(department.getDepartmentName())
                .build();
    }
}
