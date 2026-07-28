package com.mars.service;

import java.util.List;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.DepartmentResponseDto;
import com.mars.mapper.DepartmentMapper;
import com.mars.repository.DepartmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    @Transactional(readOnly = true)
    public List<DepartmentResponseDto> getAllDepartments() {
        Map<String, DepartmentResponseDto> uniqueDepartments = new LinkedHashMap<>();
        departmentRepository.findAll().stream()
                .map(departmentMapper::toResponse)
                .sorted(Comparator.comparing(DepartmentResponseDto::getDepartmentName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(DepartmentResponseDto::getDepartmentId))
                .forEach(department ->
                        uniqueDepartments.putIfAbsent(normalizeDepartmentName(department.getDepartmentName()), department));
        return uniqueDepartments.values().stream().toList();
    }

    private static String normalizeDepartmentName(String departmentName) {
        return departmentName == null ? "" : departmentName.trim().toLowerCase(Locale.ROOT);
    }
}
