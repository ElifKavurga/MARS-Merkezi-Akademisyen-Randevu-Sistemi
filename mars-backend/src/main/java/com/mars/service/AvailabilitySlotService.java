package com.mars.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.mapper.AvailabilitySlotMapper;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AvailabilitySlotService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AvailabilitySlotMapper availabilitySlotMapper;

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponseDto> getMySlots() {
        User currentUser = getCurrentUser();
        return availabilitySlotRepository
                .findByStaffIdOrderBySlotDateAscStartTimeAsc(currentUser.getUserId())
                .stream()
                .map(availabilitySlotMapper::toResponse)
                .toList();
    }

    @Transactional
    public AvailabilitySlotResponseDto createSlot(AvailabilitySlotCreateRequest request) {
        User currentUser = getCurrentUser();

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Başlangıç saati bitiş saatinden önce olmalıdır.");
        }

        if (request.getSlotDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Geçmiş tarih için ofis saati oluşturulamaz.");
        }

        if (availabilitySlotRepository.existsOverlappingSlot(
                currentUser.getUserId(),
                request.getSlotDate(),
                request.getStartTime(),
                request.getEndTime())) {
            throw new ConflictException("Bu tarih ve saat aralığında çakışan bir ofis saati bulunmaktadır.");
        }

        AvailabilitySlot slot = availabilitySlotMapper.toEntity(request, currentUser);
        AvailabilitySlot saved = availabilitySlotRepository.save(slot);
        return availabilitySlotMapper.toResponse(saved);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return userDetails.getUser();
    }
}
