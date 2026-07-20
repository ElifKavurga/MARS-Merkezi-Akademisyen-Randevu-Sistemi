package com.mars.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.admin.AppointmentCategoryRequest;
import com.mars.dto.admin.AppointmentCategoryResponse;
import com.mars.entity.AppointmentCategory;
import com.mars.enums.CategoryGroup;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.AppointmentCategoryMapper;
import com.mars.repository.AppointmentCategoryRepository;
import com.mars.repository.AppointmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminAppointmentCategoryService {

    private final AppointmentCategoryRepository appointmentCategoryRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentCategoryMapper appointmentCategoryMapper;

    @Transactional(readOnly = true)
    public List<AppointmentCategoryResponse> getAllCategories() {
        return appointmentCategoryRepository.findAllByOrderByCategoryIdAsc().stream()
                .map(appointmentCategoryMapper::toResponse)
                .toList();
    }

    @Transactional
    public AppointmentCategoryResponse createCategory(AppointmentCategoryRequest request) {
        validateRequest(request);

        if (appointmentCategoryRepository.existsByCategoryName(request.getCategoryName())) {
            throw new ConflictException("Bu kategori adı zaten kayıtlı.");
        }

        AppointmentCategory category = appointmentCategoryMapper.toEntity(request);
        AppointmentCategory saved = appointmentCategoryRepository.save(category);
        return appointmentCategoryMapper.toResponse(saved);
    }

    @Transactional
    public AppointmentCategoryResponse updateCategory(Integer id, AppointmentCategoryRequest request) {
        validateRequest(request);

        AppointmentCategory category = appointmentCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori bulunamadı."));

        if (appointmentCategoryRepository.existsByCategoryNameAndCategoryIdNot(
                request.getCategoryName(), id)) {
            throw new ConflictException("Bu kategori adı zaten kayıtlı.");
        }

        appointmentCategoryMapper.updateEntity(category, request);
        AppointmentCategory saved = appointmentCategoryRepository.save(category);
        return appointmentCategoryMapper.toResponse(saved);
    }

    @Transactional
    public void deleteCategory(Integer id) {
        AppointmentCategory category = appointmentCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori bulunamadı."));

        if (appointmentRepository.existsByCategory_CategoryId(id)) {
            throw new ConflictException(
                    "Kategori mevcut randevularda kullanıldığı için silinemez.");
        }

        appointmentCategoryRepository.delete(category);
    }

    private void validateRequest(AppointmentCategoryRequest request) {
        if (request.getCategoryName() == null || request.getCategoryName().isBlank()) {
            throw new BadRequestException("Kategori adı zorunludur.");
        }
        if (request.getDurationMinutes() == null || request.getDurationMinutes() <= 0) {
            throw new BadRequestException("Süre 0'dan büyük olmalıdır.");
        }
        if (request.getRequiresCourseSelection() == null) {
            throw new BadRequestException("Ders seçimi zorunluluk bilgisi gereklidir.");
        }
        boolean validGroup = Arrays.stream(CategoryGroup.values())
                .anyMatch(group -> group.name().equals(request.getCategoryGroup()));
        if (!validGroup) {
            throw new BadRequestException(
                    "Kategori grubu ACADEMIC, COURSE_EXAM veya ADMINISTRATIVE olmalıdır.");
        }
    }
}
