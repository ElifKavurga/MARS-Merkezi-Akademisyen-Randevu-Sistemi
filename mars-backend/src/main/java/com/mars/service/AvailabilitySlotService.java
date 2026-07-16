package com.mars.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.AvailabilitySlotBlockRequest;
import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.dto.AvailabilitySlotUpdateRequest;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.AvailabilitySlotMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AvailabilitySlotService {

    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AppointmentRepository appointmentRepository;
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
        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateNotPastDate(request.getSlotDate(), "Geçmiş tarih için ofis saati oluşturulamaz.");

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

    @Transactional
    public AvailabilitySlotResponseDto updateSlot(Integer slotId, AvailabilitySlotUpdateRequest request) {
        User currentUser = getCurrentUser();
        AvailabilitySlot slot = getOwnedSlot(slotId, currentUser, "Bu ofis saatini güncelleme yetkiniz yok.");

        if (Boolean.TRUE.equals(slot.getIsBlocked())) {
            throw new BadRequestException("Pasif ofis saati güncellenemez.");
        }

        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateNotPastDate(request.getSlotDate(), "Geçmiş tarih için ofis saati güncellenemez.");

        if (appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(
                slotId, ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException(
                    "Bu ofis saatine ait aktif randevular bulunduğu için güncelleme yapılamaz.");
        }

        if (availabilitySlotRepository.existsOverlappingSlotExcludingId(
                currentUser.getUserId(),
                request.getSlotDate(),
                request.getStartTime(),
                request.getEndTime(),
                slotId)) {
            throw new ConflictException("Bu tarih ve saat aralığında çakışan bir ofis saati bulunmaktadır.");
        }

        availabilitySlotMapper.updateEntity(slot, request);
        AvailabilitySlot saved = availabilitySlotRepository.save(slot);
        return availabilitySlotMapper.toResponse(saved);
    }

    @Transactional
    public AvailabilitySlotResponseDto updateBlockedStatus(Integer slotId, AvailabilitySlotBlockRequest request) {
        User currentUser = getCurrentUser();
        AvailabilitySlot slot = getOwnedSlot(slotId, currentUser, "Bu ofis saatinin durumunu değiştirme yetkiniz yok.");

        boolean currentlyBlocked = Boolean.TRUE.equals(slot.getIsBlocked());
        boolean targetBlocked = Boolean.TRUE.equals(request.getIsBlocked());

        if (currentlyBlocked == targetBlocked) {
            throw new BadRequestException(targetBlocked
                    ? "Bu ofis saati zaten engelli."
                    : "Bu ofis saati zaten uygun durumda.");
        }

        if (targetBlocked
                && appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(
                        slotId, ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException(
                    "Bu ofis saatine ait aktif randevular bulunduğu için slot engellenemez.");
        }

        availabilitySlotMapper.applyBlockStatus(slot, request);
        AvailabilitySlot saved = availabilitySlotRepository.save(slot);
        return availabilitySlotMapper.toResponse(saved);
    }

    private void validateTimeRange(java.time.LocalTime startTime, java.time.LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Başlangıç saati bitiş saatinden önce olmalıdır.");
        }
    }

    private void validateNotPastDate(LocalDate slotDate, String message) {
        if (slotDate.isBefore(LocalDate.now())) {
            throw new BadRequestException(message);
        }
    }

    private AvailabilitySlot getOwnedSlot(Integer slotId, User currentUser, String accessDeniedMessage) {
        AvailabilitySlot slot = availabilitySlotRepository.findByIdWithStaff(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Ofis saati bulunamadı."));

        if (slot.getStaff() == null
                || !Objects.equals(slot.getStaff().getUserId(), currentUser.getUserId())) {
            throw new AccessDeniedException(accessDeniedMessage);
        }

        return slot;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return userDetails.getUser();
    }
}
