package com.mars.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.StudentAppointmentCategoryResponseDto;
import com.mars.mapper.AppointmentCategoryMapper;
import com.mars.repository.AppointmentCategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StudentAppointmentCategoryService {

    private final AppointmentCategoryRepository appointmentCategoryRepository;
    private final AppointmentCategoryMapper appointmentCategoryMapper;

    /**
     * Öğrenci randevu akışı için kategoriler.
     * Modelde isActive / displayOrder yok; tüm kayıtlar categoryId sırasıyla döner
     * (admin oluşturma sırası).
     */
    @Transactional(readOnly = true)
    public List<StudentAppointmentCategoryResponseDto> listActiveCategories() {
        return appointmentCategoryRepository.findAllByOrderByCategoryIdAsc().stream()
                .map(appointmentCategoryMapper::toStudentResponse)
                .toList();
    }
}
