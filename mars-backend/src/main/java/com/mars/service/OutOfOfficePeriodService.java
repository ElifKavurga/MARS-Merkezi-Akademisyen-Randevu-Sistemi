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

import com.mars.OutOfOfficePeriodMessages;
import com.mars.dto.OutOfOfficePeriodCreateRequest;
import com.mars.dto.OutOfOfficePeriodResponseDto;
import com.mars.dto.OutOfOfficePeriodUpdateRequest;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.OutOfOfficePeriod;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.ReasonCode;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.OutOfOfficePeriodMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.OutOfOfficePeriodRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OutOfOfficePeriodService {

    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    private final OutOfOfficePeriodRepository outOfOfficePeriodRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final OutOfOfficePeriodMapper outOfOfficePeriodMapper;

    @Transactional(readOnly = true)
    public List<OutOfOfficePeriodResponseDto> getMyPeriods() {
        User currentUser = getCurrentUser();
        return outOfOfficePeriodRepository
                .findByStaffIdOrderByStartDateAscEndDateAsc(currentUser.getUserId())
                .stream()
                .map(outOfOfficePeriodMapper::toResponse)
                .toList();
    }

    @Transactional
    public OutOfOfficePeriodResponseDto createPeriod(OutOfOfficePeriodCreateRequest request) {
        User currentUser = getCurrentUser();
        validateDateFields(request.getStartDate(), request.getEndDate(), request.getReasonCode());
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new BadRequestException(OutOfOfficePeriodMessages.PAST_DATE);
        }

        Integer staffId = currentUser.getUserId();
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        if (outOfOfficePeriodRepository.existsOverlappingPeriod(staffId, startDate, endDate)) {
            throw new ConflictException(OutOfOfficePeriodMessages.OVERLAP);
        }

        if (appointmentRepository.existsActiveAppointmentsForStaffInDateRange(
                staffId, startDate, endDate, ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException(OutOfOfficePeriodMessages.ACTIVE_APPOINTMENTS);
        }

        OutOfOfficePeriod period = outOfOfficePeriodMapper.toEntity(request, currentUser);
        OutOfOfficePeriod saved = outOfOfficePeriodRepository.save(period);

        blockSlotsInRange(staffId, startDate, endDate);

        return outOfOfficePeriodMapper.toResponse(saved);
    }

    @Transactional
    public OutOfOfficePeriodResponseDto updatePeriod(
            Integer outOfOfficeId, OutOfOfficePeriodUpdateRequest request) {
        User currentUser = getCurrentUser();
        OutOfOfficePeriod period = getOwnedPeriod(outOfOfficeId, currentUser);

        LocalDate today = LocalDate.now();
        if (period.getEndDate() != null && period.getEndDate().isBefore(today)) {
            throw new BadRequestException(OutOfOfficePeriodMessages.PAST_PERIOD_NOT_UPDATABLE);
        }

        validateDateFields(request.getStartDate(), request.getEndDate(), request.getReasonCode());

        Integer staffId = currentUser.getUserId();
        LocalDate oldStart = period.getStartDate();
        LocalDate oldEnd = period.getEndDate();
        LocalDate newStart = request.getStartDate();
        LocalDate newEnd = request.getEndDate();

        if (outOfOfficePeriodRepository.existsOverlappingPeriodExcludingId(
                staffId, newStart, newEnd, outOfOfficeId)) {
            throw new ConflictException(OutOfOfficePeriodMessages.OVERLAP);
        }

        if (appointmentRepository.existsActiveAppointmentsForStaffInDateRange(
                staffId, newStart, newEnd, ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException(OutOfOfficePeriodMessages.ACTIVE_APPOINTMENTS_UPDATE);
        }

        outOfOfficePeriodMapper.updateEntity(period, request);
        OutOfOfficePeriod saved = outOfOfficePeriodRepository.save(period);

        reevaluateSlotsAfterUpdate(staffId, outOfOfficeId, oldStart, oldEnd, newStart, newEnd);

        return outOfOfficePeriodMapper.toResponse(saved);
    }

    @Transactional
    public OutOfOfficePeriodResponseDto endPeriod(Integer outOfOfficeId) {
        User currentUser = getCurrentUser();
        OutOfOfficePeriod period = getOwnedPeriod(
                outOfOfficeId, currentUser, OutOfOfficePeriodMessages.END_ACCESS_DENIED);

        LocalDate today = LocalDate.now();
        if (period.getEndDate() != null && period.getEndDate().isBefore(today)) {
            throw new BadRequestException(OutOfOfficePeriodMessages.PAST_PERIOD_NOT_ENDABLE);
        }
        if (period.getEndDate() != null && !period.getEndDate().isAfter(today)) {
            throw new ConflictException(OutOfOfficePeriodMessages.ALREADY_ENDED);
        }

        Integer staffId = currentUser.getUserId();
        LocalDate oldStart = period.getStartDate();
        LocalDate oldEnd = period.getEndDate();

        outOfOfficePeriodMapper.applyEnd(period, today);
        OutOfOfficePeriod saved = outOfOfficePeriodRepository.save(period);

        reevaluateSlotsAfterEnd(staffId, outOfOfficeId, oldStart, oldEnd, period.getStartDate(), today);

        return outOfOfficePeriodMapper.toResponse(saved);
    }

    private void reevaluateSlotsAfterUpdate(
            Integer staffId,
            Integer outOfOfficeId,
            LocalDate oldStart,
            LocalDate oldEnd,
            LocalDate newStart,
            LocalDate newEnd) {
        releaseSlotsOutsideRange(staffId, outOfOfficeId, oldStart, oldEnd, newStart, newEnd);
        blockSlotsInRange(staffId, newStart, newEnd);
    }

    private void reevaluateSlotsAfterEnd(
            Integer staffId,
            Integer outOfOfficeId,
            LocalDate oldStart,
            LocalDate oldEnd,
            LocalDate newStart,
            LocalDate newEnd) {
        releaseSlotsOutsideRange(staffId, outOfOfficeId, oldStart, oldEnd, newStart, newEnd);
    }

    private void releaseSlotsOutsideRange(
            Integer staffId,
            Integer outOfOfficeId,
            LocalDate oldStart,
            LocalDate oldEnd,
            LocalDate newStart,
            LocalDate newEnd) {
        List<AvailabilitySlot> previouslyCovered =
                availabilitySlotRepository.findByStaff_UserIdAndSlotDateBetween(staffId, oldStart, oldEnd);
        for (AvailabilitySlot slot : previouslyCovered) {
            LocalDate slotDate = slot.getSlotDate();
            boolean stillInUpdatedRange = !slotDate.isBefore(newStart) && !slotDate.isAfter(newEnd);
            if (stillInUpdatedRange) {
                continue;
            }
            boolean coveredByOtherOoo = outOfOfficePeriodRepository.existsOtherPeriodCoveringDate(
                    staffId, slotDate, outOfOfficeId);
            if (!coveredByOtherOoo) {
                slot.setIsBlocked(false);
            }
        }
        if (!previouslyCovered.isEmpty()) {
            availabilitySlotRepository.saveAll(previouslyCovered);
        }
    }

    private void blockSlotsInRange(Integer staffId, LocalDate startDate, LocalDate endDate) {
        List<AvailabilitySlot> slots =
                availabilitySlotRepository.findByStaff_UserIdAndSlotDateBetween(staffId, startDate, endDate);
        if (slots.isEmpty()) {
            return;
        }
        for (AvailabilitySlot slot : slots) {
            slot.setIsBlocked(true);
        }
        availabilitySlotRepository.saveAll(slots);
    }

    private OutOfOfficePeriod getOwnedPeriod(Integer outOfOfficeId, User currentUser) {
        return getOwnedPeriod(outOfOfficeId, currentUser, OutOfOfficePeriodMessages.ACCESS_DENIED);
    }

    private OutOfOfficePeriod getOwnedPeriod(
            Integer outOfOfficeId, User currentUser, String accessDeniedMessage) {
        OutOfOfficePeriod period = outOfOfficePeriodRepository.findByIdWithStaff(outOfOfficeId)
                .orElseThrow(() -> new ResourceNotFoundException(OutOfOfficePeriodMessages.PERIOD_NOT_FOUND));

        if (period.getStaff() == null
                || !Objects.equals(period.getStaff().getUserId(), currentUser.getUserId())) {
            throw new AccessDeniedException(accessDeniedMessage);
        }
        return period;
    }

    private void validateDateFields(LocalDate startDate, LocalDate endDate, String reasonCode) {
        if (startDate == null) {
            throw new BadRequestException(OutOfOfficePeriodMessages.START_DATE_REQUIRED);
        }
        if (endDate == null) {
            throw new BadRequestException(OutOfOfficePeriodMessages.END_DATE_REQUIRED);
        }
        if (reasonCode == null || reasonCode.isBlank()) {
            throw new BadRequestException(OutOfOfficePeriodMessages.REASON_CODE_REQUIRED);
        }
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException(OutOfOfficePeriodMessages.INVALID_DATE_RANGE);
        }
        validateReasonCode(reasonCode);
    }

    private void validateReasonCode(String reasonCode) {
        try {
            ReasonCode.valueOf(reasonCode.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(OutOfOfficePeriodMessages.INVALID_REASON_CODE);
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return userDetails.getUser();
    }
}
