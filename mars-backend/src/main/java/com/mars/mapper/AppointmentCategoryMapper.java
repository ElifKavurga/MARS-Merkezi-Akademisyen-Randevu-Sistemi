package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.admin.AppointmentCategoryRequest;
import com.mars.dto.admin.AppointmentCategoryResponse;
import com.mars.dto.StudentAppointmentCategoryResponseDto;
import com.mars.entity.AppointmentCategory;

@Component
public class AppointmentCategoryMapper {

    public AppointmentCategoryResponse toResponse(AppointmentCategory category) {
        return AppointmentCategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .durationMinutes(category.getDurationMinutes())
                .categoryGroup(category.getCategoryGroup())
                .requiresCourseSelection(category.getRequiresCourseSelection())
                .build();
    }

    public StudentAppointmentCategoryResponseDto toStudentResponse(AppointmentCategory category) {
        return StudentAppointmentCategoryResponseDto.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .description(null)
                .durationMinutes(category.getDurationMinutes())
                .categoryGroup(category.getCategoryGroup())
                .requiresCourseSelection(Boolean.TRUE.equals(category.getRequiresCourseSelection()))
                .build();
    }

    public AppointmentCategory toEntity(AppointmentCategoryRequest request) {
        AppointmentCategory category = new AppointmentCategory();
        applyRequest(category, request);
        return category;
    }

    public void updateEntity(AppointmentCategory category, AppointmentCategoryRequest request) {
        applyRequest(category, request);
    }

    private void applyRequest(AppointmentCategory category, AppointmentCategoryRequest request) {
        category.setCategoryName(request.getCategoryName());
        category.setDurationMinutes(request.getDurationMinutes());
        category.setCategoryGroup(request.getCategoryGroup());
        category.setRequiresCourseSelection(request.getRequiresCourseSelection());
    }
}
