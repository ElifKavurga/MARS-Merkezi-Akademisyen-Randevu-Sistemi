package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mars.dto.StudentAppointmentCategoryResponseDto;
import com.mars.entity.AppointmentCategory;
import com.mars.mapper.AppointmentCategoryMapper;
import com.mars.repository.AppointmentCategoryRepository;

@ExtendWith(MockitoExtension.class)
class StudentAppointmentCategoryServiceTest {

    @Mock
    private AppointmentCategoryRepository appointmentCategoryRepository;

    @Mock
    private AppointmentCategoryMapper appointmentCategoryMapper;

    @InjectMocks
    private StudentAppointmentCategoryService studentAppointmentCategoryService;

    @Test
    void listActiveCategories_returnsMappedCategoriesInAdminOrder() {
        AppointmentCategory entity = new AppointmentCategory();
        entity.setCategoryId(2);
        entity.setCategoryName("Genel Görüşme");
        entity.setDurationMinutes(20);
        entity.setCategoryGroup("ACADEMIC");
        entity.setRequiresCourseSelection(false);

        StudentAppointmentCategoryResponseDto dto = StudentAppointmentCategoryResponseDto.builder()
                .categoryId(2)
                .categoryName("Genel Görüşme")
                .description(null)
                .durationMinutes(20)
                .categoryGroup("ACADEMIC")
                .requiresCourseSelection(false)
                .build();

        when(appointmentCategoryRepository.findAllByOrderByCategoryIdAsc()).thenReturn(List.of(entity));
        when(appointmentCategoryMapper.toStudentResponse(entity)).thenReturn(dto);

        List<StudentAppointmentCategoryResponseDto> result =
                studentAppointmentCategoryService.listActiveCategories();

        assertThat(result).containsExactly(dto);
        verify(appointmentCategoryRepository).findAllByOrderByCategoryIdAsc();
    }
}
