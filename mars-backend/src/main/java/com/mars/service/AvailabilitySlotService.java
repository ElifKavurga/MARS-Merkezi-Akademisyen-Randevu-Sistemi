package com.mars.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.AvailabilitySlotMessages;
import com.mars.dto.AvailabilitySlotBlockRequest;
import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.dto.AvailabilitySlotStatsResponseDto;
import com.mars.dto.AvailabilitySlotUpdateRequest;
import com.mars.dto.RecurrenceRuleCreateRequest;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.OfficeHourType;
import com.mars.enums.RecurrenceEndMode;
import com.mars.enums.RepeatType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.AvailabilitySlotMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;
import com.mars.util.AcademicTermCalendar;
import com.mars.util.AvailabilityTimeRules;

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
    private final RecurrenceRuleService recurrenceRuleService;

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponseDto> getMySlots() {
        User currentUser = getCurrentUser();
        return availabilitySlotRepository
                .findByStaffIdOrderBySlotDateAscStartTimeAsc(currentUser.getUserId())
                .stream()
                .map(availabilitySlotMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AvailabilitySlotStatsResponseDto getMyStats() {
        User currentUser = getCurrentUser();
        Integer staffId = currentUser.getUserId();

        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        long total = availabilitySlotRepository.countByStaff_UserId(staffId);
        long blocked = availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(staffId, true);
        long available = availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(staffId, false);
        long thisWeek = availabilitySlotRepository.countByStaff_UserIdAndSlotDateBetween(
                staffId, weekStart, weekEnd);

        return availabilitySlotMapper.toStatsResponse(total, available, blocked, thisWeek);
    }

    @Transactional
    public List<AvailabilitySlotResponseDto> createSlots(AvailabilitySlotCreateRequest request) {
        User currentUser = getCurrentUser();
        AvailabilityTimeRules.validateTimeRange(request.getStartTime(), request.getEndTime());

        OfficeHourType slotType = parseSlotType(request.getSlotType());
        if (slotType == OfficeHourType.ONE_TIME) {
            return List.of(createOneTimeSlot(request, currentUser));
        }
        return createRecurringSlots(request, currentUser);
    }

    @Transactional
    public AvailabilitySlotResponseDto updateSlot(Integer slotId, AvailabilitySlotUpdateRequest request) {
        User currentUser = getCurrentUser();
        AvailabilitySlot slot = getOwnedSlot(slotId, currentUser, AvailabilitySlotMessages.UPDATE_DENIED);

        if (Boolean.TRUE.equals(slot.getIsBlocked())) {
            throw new BadRequestException(AvailabilitySlotMessages.BLOCKED_NOT_EDITABLE);
        }

        AvailabilityTimeRules.validateTimeRange(request.getStartTime(), request.getEndTime());
        validateNotPastDate(request.getSlotDate(), AvailabilitySlotMessages.PAST_DATE_UPDATE);

        if (hasActiveAppointments(slotId)) {
            throw new ConflictException(AvailabilitySlotMessages.UPDATE_ACTIVE_APPOINTMENTS);
        }

        if (availabilitySlotRepository.existsOverlappingSlotExcludingId(
                currentUser.getUserId(),
                request.getSlotDate(),
                request.getStartTime(),
                request.getEndTime(),
                slotId)) {
            throw new ConflictException(AvailabilitySlotMessages.OVERLAP);
        }

        availabilitySlotMapper.updateEntity(slot, request);
        AvailabilitySlot saved = availabilitySlotRepository.save(slot);
        return availabilitySlotMapper.toResponse(saved);
    }

    @Transactional
    public AvailabilitySlotResponseDto updateBlockedStatus(Integer slotId, AvailabilitySlotBlockRequest request) {
        User currentUser = getCurrentUser();
        AvailabilitySlot slot = getOwnedSlot(slotId, currentUser, AvailabilitySlotMessages.BLOCK_DENIED);

        boolean currentlyBlocked = Boolean.TRUE.equals(slot.getIsBlocked());
        boolean targetBlocked = Boolean.TRUE.equals(request.getIsBlocked());

        if (currentlyBlocked == targetBlocked) {
            throw new BadRequestException(targetBlocked
                    ? AvailabilitySlotMessages.ALREADY_BLOCKED
                    : AvailabilitySlotMessages.ALREADY_AVAILABLE);
        }

        if (targetBlocked && hasActiveAppointments(slotId)) {
            throw new ConflictException(AvailabilitySlotMessages.BLOCK_ACTIVE_APPOINTMENTS);
        }

        availabilitySlotMapper.applyBlockStatus(slot, request);
        AvailabilitySlot saved = availabilitySlotRepository.save(slot);
        return availabilitySlotMapper.toResponse(saved);
    }

    private AvailabilitySlotResponseDto createOneTimeSlot(
            AvailabilitySlotCreateRequest request, User currentUser) {
        if (request.getSlotDate() == null) {
            throw new BadRequestException(AvailabilitySlotMessages.SLOT_DATE_REQUIRED);
        }
        return persistSlot(
                currentUser,
                request.getSlotDate(),
                request.getStartTime(),
                request.getEndTime(),
                null);
    }

    private List<AvailabilitySlotResponseDto> createRecurringSlots(
            AvailabilitySlotCreateRequest request, User currentUser) {
        List<DayOfWeek> selectedDays = normalizeSelectedDays(request.getDaysOfWeek());
        LocalDate recurrenceEndDate = resolveRecurrenceEndDate(request, LocalDate.now());

        List<AvailabilitySlotResponseDto> created = new ArrayList<>();
        for (DayOfWeek day : selectedDays) {
            LocalDate slotDate = LocalDate.now().with(TemporalAdjusters.nextOrSame(day));
            if (recurrenceEndDate.isBefore(slotDate)) {
                throw new BadRequestException(AvailabilitySlotMessages.RECURRENCE_END_BEFORE_START);
            }
            created.add(persistSlot(
                    currentUser,
                    slotDate,
                    request.getStartTime(),
                    request.getEndTime(),
                    recurrenceEndDate));
        }
        return created;
    }

    private AvailabilitySlotResponseDto persistSlot(
            User currentUser,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate recurrenceEndDate) {
        validateNotPastDate(slotDate, AvailabilitySlotMessages.PAST_DATE_CREATE);

        if (availabilitySlotRepository.existsOverlappingSlot(
                currentUser.getUserId(), slotDate, startTime, endTime)) {
            throw new ConflictException(AvailabilitySlotMessages.OVERLAP);
        }

        AvailabilitySlot slot = availabilitySlotMapper.toEntity(slotDate, startTime, endTime, currentUser);
        AvailabilitySlot saved = availabilitySlotRepository.save(slot);

        if (recurrenceEndDate != null) {
            recurrenceRuleService.createRule(
                    saved.getSlotId(),
                    buildWeeklyRecurrenceRequest(slotDate, recurrenceEndDate));
            saved = availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(saved.getSlotId())
                    .orElse(saved);
        }

        return availabilitySlotMapper.toResponse(saved);
    }

    private OfficeHourType parseSlotType(String slotType) {
        if (slotType == null || slotType.isBlank()) {
            throw new BadRequestException(AvailabilitySlotMessages.SLOT_TYPE_REQUIRED);
        }
        try {
            return OfficeHourType.valueOf(slotType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(AvailabilitySlotMessages.SLOT_TYPE_REQUIRED);
        }
    }

    private RecurrenceRuleCreateRequest buildWeeklyRecurrenceRequest(LocalDate startDate, LocalDate endDate) {
        return new RecurrenceRuleCreateRequest(
                RepeatType.WEEKLY.name(),
                AvailabilityTimeRules.WEEKLY_REPEAT_COUNT,
                startDate,
                endDate);
    }

    private LocalDate resolveRecurrenceEndDate(AvailabilitySlotCreateRequest request, LocalDate today) {
        if (request.getRecurrenceEndMode() == null || request.getRecurrenceEndMode().isBlank()) {
            throw new BadRequestException(AvailabilitySlotMessages.RECURRENCE_END_MODE_REQUIRED);
        }

        RecurrenceEndMode mode;
        try {
            mode = RecurrenceEndMode.valueOf(request.getRecurrenceEndMode().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(AvailabilitySlotMessages.RECURRENCE_END_MODE_REQUIRED);
        }

        if (mode == RecurrenceEndMode.TERM_END) {
            return AcademicTermCalendar.resolveCurrentTermEndDate(today);
        }

        if (request.getRecurrenceEndDate() == null) {
            throw new BadRequestException(AvailabilitySlotMessages.RECURRENCE_END_DATE_REQUIRED);
        }
        return request.getRecurrenceEndDate();
    }

    private List<DayOfWeek> normalizeSelectedDays(List<Integer> daysOfWeek) {
        if (daysOfWeek == null || daysOfWeek.isEmpty()) {
            throw new BadRequestException(AvailabilitySlotMessages.DAYS_REQUIRED);
        }

        Set<DayOfWeek> uniqueDays = new LinkedHashSet<>();
        for (Integer dayValue : daysOfWeek) {
            if (dayValue == null || dayValue < 1 || dayValue > 5) {
                throw new BadRequestException(AvailabilitySlotMessages.INVALID_DAY);
            }
            uniqueDays.add(DayOfWeek.of(dayValue));
        }
        if (uniqueDays.isEmpty()) {
            throw new BadRequestException(AvailabilitySlotMessages.DAYS_REQUIRED);
        }
        return List.copyOf(uniqueDays);
    }

    private boolean hasActiveAppointments(Integer slotId) {
        return appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(
                slotId, ACTIVE_APPOINTMENT_STATUSES);
    }

    private void validateNotPastDate(LocalDate slotDate, String message) {
        if (slotDate.isBefore(LocalDate.now())) {
            throw new BadRequestException(message);
        }
    }

    private AvailabilitySlot getOwnedSlot(Integer slotId, User currentUser, String accessDeniedMessage) {
        AvailabilitySlot slot = availabilitySlotRepository.findByIdWithStaff(slotId)
                .orElseThrow(() -> new ResourceNotFoundException(AvailabilitySlotMessages.SLOT_NOT_FOUND));

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
