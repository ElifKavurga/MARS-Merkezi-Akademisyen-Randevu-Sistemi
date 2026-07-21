package com.mars.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
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

import com.mars.AppointmentConstraints;
import com.mars.AvailabilitySlotMessages;
import com.mars.dto.AvailabilitySlotBlockRequest;
import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.dto.AvailabilitySlotStatsResponseDto;
import com.mars.dto.AvailabilitySlotUpdateRequest;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.RecurrenceRuleCreateRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.enums.OfficeHourType;
import com.mars.enums.RecurrenceEndMode;
import com.mars.enums.RepeatType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.AvailabilitySlotMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.OutOfOfficePeriodRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;
import com.mars.util.AcademicTermCalendar;
import com.mars.util.AvailabilityTimeRules;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AvailabilitySlotService {

    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");

    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final OutOfOfficePeriodRepository outOfOfficePeriodRepository;
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

    @Transactional(readOnly = true)
    public List<AvailableSlotResponseDto> getAvailableSlotsForStaff(Integer staffId) {
        if (staffId == null) {
            throw new BadRequestException("Akademisyen seçimi zorunludur.");
        }
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDate today = now.toLocalDate();
        LocalDateTime earliestBookable = now.plusMinutes(AppointmentConstraints.MINIMUM_BOOKING_NOTICE_MINUTES);
        return availabilitySlotRepository
                .findAvailableSlotsForStaff(staffId, today, ACTIVE_APPOINTMENT_STATUSES)
                .stream()
                .filter(slot -> !isSlotInPast(slot, today, now.toLocalTime()))
                .filter(slot -> isSlotAfterBookingNotice(slot, earliestBookable))
                .filter(slot -> !outOfOfficePeriodRepository.existsOverlappingPeriod(
                        staffId, slot.getSlotDate(), slot.getSlotDate()))
                .map(availabilitySlotMapper::toAvailableResponse)
                .toList();
    }

    /**
     * Öğrenci randevu akışı için uygun slotlar.
     * Recurrence genişletmesi → durationMinutes dilimleme → BR-017 / OOO / blocked / randevu filtreleri.
     */
    @Transactional(readOnly = true)
    public List<AvailableSlotResponseDto> getBookableAvailableSlotsForStaff(
            Integer staffId,
            Integer durationMinutes) {
        return getBookableAvailableSlotsForStaff(staffId, durationMinutes, false);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponseDto> getBookableAvailableSlotsForStaff(
            Integer staffId,
            Integer durationMinutes,
            Boolean includeBooked) {
        if (staffId == null) {
            throw new BadRequestException("Akademisyen seçimi zorunludur.");
        }
        if (durationMinutes == null || durationMinutes < 1) {
            throw new BadRequestException("Geçerli bir görüşme süresi zorunludur.");
        }

        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDate today = now.toLocalDate();
        // Regresyon düzeltmesi: today+14 sert kesimi, OOO sonrası uygun haftalık
        // occurrence'ları (ör. 6 Ağustos+) yanlışlıkla eliyordu. Dönem ufku geri.
        LocalDate rangeEnd = AcademicTermCalendar.resolveBookableHorizonEnd(today);
        LocalDateTime earliestBookable = now.plusMinutes(AppointmentConstraints.MINIMUM_BOOKING_NOTICE_MINUTES);

        long totalSlotsForStaff = availabilitySlotRepository.countByStaff_UserId(staffId);
        long availableUnblocked = availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(staffId, false);

        List<AvailabilitySlot> templates =
                availabilitySlotRepository.findBookableSlotTemplatesForStaff(staffId, today, ACTIVE_APPOINTMENT_STATUSES);

        int availabilitySlotCount = templates.size();
        int recurrenceCount = 0;
        for (AvailabilitySlot slot : templates) {
            if (slot.getRecurrenceRule() != null) {
                recurrenceCount++;
            }
        }

        log.info("AvailabilitySlot count={}", availabilitySlotCount);
        log.info(
                "AvailabilitySlot diagnostic staffId={} totalRows={} unblockedRows={} today={} rangeEnd={}",
                staffId,
                totalSlotsForStaff,
                availableUnblocked,
                today,
                rangeEnd);
        log.info("Recurrence count={}", recurrenceCount);

        if (availabilitySlotCount == 0 && availableUnblocked > 0) {
            log.warn(
                    "Repository returned 0 bookable templates but staff has {} unblocked AvailabilitySlot rows. Check findBookableSlotTemplatesForStaff.",
                    availableUnblocked);
        }

        List<Appointment> activeAppointments =
                appointmentRepository.findActiveAppointmentsForStaffInDateRange(
                        staffId, today, rangeEnd, ACTIVE_APPOINTMENT_STATUSES);

        record Candidate(
                AvailabilitySlot slot,
                LocalDate occurrenceDate,
                LocalTime windowStart,
                LocalTime windowEnd) {
        }

        List<Candidate> candidates = new ArrayList<>();
        int occurrenceCount = 0;
        for (AvailabilitySlot slot : templates) {
            List<LocalDate> occurrences = expandOccurrenceDates(slot, today, rangeEnd);
            occurrenceCount += occurrences.size();
            log.info(
                    "slotId={} hasRecurrence={} repeatType={} occurrenceCount={} officeHours={}-{}",
                    slot.getSlotId(),
                    slot.getRecurrenceRule() != null,
                    slot.getRecurrenceRule() != null ? slot.getRecurrenceRule().getRepeatType() : null,
                    occurrences.size(),
                    slot.getStartTime(),
                    slot.getEndTime());

            for (LocalDate occurrenceDate : occurrences) {
                for (LocalTime[] window : splitIntoDurationWindows(
                        slot.getStartTime(), slot.getEndTime(), durationMinutes)) {
                    candidates.add(new Candidate(slot, occurrenceDate, window[0], window[1]));
                }
            }
        }

        log.info("Occurrence count={}", occurrenceCount);
        log.info("Generated reservation slots={}", candidates.size());
        log.info("After reservation window filter={}", candidates.size());

        candidates.removeIf(c ->
                isOccurrenceBeforeBookingNotice(c.occurrenceDate(), c.windowStart(), earliestBookable));
        log.info("After BR-017={}", candidates.size());

        candidates.removeIf(c -> outOfOfficePeriodRepository.existsOverlappingPeriod(
                staffId, c.occurrenceDate(), c.occurrenceDate()));
        log.info("After OutOfOffice={}", candidates.size());

        candidates.removeIf(c -> Boolean.TRUE.equals(c.slot().getIsBlocked()));
        log.info("After Blocked={}", candidates.size());

        if (!Boolean.TRUE.equals(includeBooked)) {
            candidates.removeIf(c -> hasOverlappingActiveAppointment(
                    activeAppointments, c.occurrenceDate(), c.windowStart(), c.windowEnd()));
            log.info("After Appointment filter={}", candidates.size());
        }

        List<AvailableSlotResponseDto> result = new ArrayList<>(candidates.size());
        for (Candidate candidate : candidates) {
            boolean isBooked = hasOverlappingActiveAppointment(
                    activeAppointments, candidate.occurrenceDate(), candidate.windowStart(), candidate.windowEnd());
            AvailableSlotResponseDto dto = availabilitySlotMapper.toAvailableResponse(
                    candidate.slot(),
                    candidate.occurrenceDate(),
                    candidate.windowStart(),
                    candidate.windowEnd());
            dto.setIsBooked(isBooked);
            result.add(dto);
        }
        result.sort(
                java.util.Comparator.comparing(AvailableSlotResponseDto::getSlotDate)
                        .thenComparing(AvailableSlotResponseDto::getStartTime));
        log.info("Final response count={}", result.size());
        return result;
    }

    private static List<LocalTime[]> splitIntoDurationWindows(
            LocalTime rangeStart,
            LocalTime rangeEnd,
            int durationMinutes) {
        if (rangeStart == null || rangeEnd == null || !rangeStart.isBefore(rangeEnd)) {
            return List.of();
        }
        List<LocalTime[]> windows = new ArrayList<>();
        LocalTime cursor = rangeStart;
        while (!cursor.plusMinutes(durationMinutes).isAfter(rangeEnd)) {
            LocalTime windowEnd = cursor.plusMinutes(durationMinutes);
            windows.add(new LocalTime[] {cursor, windowEnd});
            cursor = windowEnd;
        }
        return windows;
    }

    private static boolean hasOverlappingActiveAppointment(
            List<Appointment> appointments,
            LocalDate occurrenceDate,
            LocalTime windowStart,
            LocalTime windowEnd) {
        for (Appointment appointment : appointments) {
            AvailabilitySlot bookedSlot = appointment.getSlot();
            if (bookedSlot == null || bookedSlot.getSlotDate() == null) {
                continue;
            }
            if (!occurrenceDate.equals(bookedSlot.getSlotDate())) {
                continue;
            }
            if (bookedSlot.getStartTime().isBefore(windowEnd)
                    && bookedSlot.getEndTime().isAfter(windowStart)) {
                return true;
            }
        }
        return false;
    }

    private List<LocalDate> expandOccurrenceDates(AvailabilitySlot slot, LocalDate from, LocalDate to) {
        var rule = slot.getRecurrenceRule();
        if (rule == null) {
            if (!slot.getSlotDate().isBefore(from) && !slot.getSlotDate().isAfter(to)) {
                return List.of(slot.getSlotDate());
            }
            return List.of();
        }

        if (!RepeatType.WEEKLY.name().equalsIgnoreCase(rule.getRepeatType())) {
            // Sistem yalnızca WEEKLY destekler (RecurrenceRuleService); sessizce boş dönme.
            log.warn(
                    "available-slots slotId={} unsupported repeatType={} (only WEEKLY is expanded)",
                    slot.getSlotId(),
                    rule.getRepeatType());
            return List.of();
        }

        LocalDate rangeStart = rule.getStartDate().isAfter(from) ? rule.getStartDate() : from;
        LocalDate rangeEnd = rule.getEndDate().isBefore(to) ? rule.getEndDate() : to;
        if (rangeStart.isAfter(rangeEnd)) {
            return List.of();
        }

        DayOfWeek weekday = slot.getSlotDate().getDayOfWeek();
        List<LocalDate> dates = new ArrayList<>();
        LocalDate occurrence = rangeStart.with(TemporalAdjusters.nextOrSame(weekday));
        while (!occurrence.isAfter(rangeEnd)) {
            dates.add(occurrence);
            occurrence = occurrence.plusWeeks(1);
        }
        return dates;
    }

    private boolean isOccurrenceBeforeBookingNotice(
            LocalDate occurrenceDate, LocalTime startTime, LocalDateTime earliestBookable) {
        LocalDateTime slotStart = LocalDateTime.of(occurrenceDate, startTime);
        return slotStart.isBefore(earliestBookable);
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
                null,
                resolveMeetingType(request.getMeetingType()));
    }

    private List<AvailabilitySlotResponseDto> createRecurringSlots(
            AvailabilitySlotCreateRequest request, User currentUser) {
        List<DayOfWeek> selectedDays = normalizeSelectedDays(request.getDaysOfWeek());
        LocalDate recurrenceEndDate = resolveRecurrenceEndDate(request, LocalDate.now());
        String meetingType = resolveMeetingType(request.getMeetingType());

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
                    recurrenceEndDate,
                    meetingType));
        }
        return created;
    }

    private AvailabilitySlotResponseDto persistSlot(
            User currentUser,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate recurrenceEndDate,
            String meetingType) {
        validateNotPastDate(slotDate, AvailabilitySlotMessages.PAST_DATE_CREATE);

        if (availabilitySlotRepository.existsOverlappingSlot(
                currentUser.getUserId(), slotDate, startTime, endTime)) {
            throw new ConflictException(AvailabilitySlotMessages.OVERLAP);
        }

        AvailabilitySlot slot = availabilitySlotMapper.toEntity(
                slotDate, startTime, endTime, currentUser, meetingType);
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

    private String resolveMeetingType(String meetingType) {
        if (meetingType == null || meetingType.isBlank()) {
            return MeetingType.FACE_TO_FACE.name();
        }
        try {
            return MeetingType.valueOf(meetingType.trim().toUpperCase()).name();
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(AvailabilitySlotMessages.INVALID_MEETING_TYPE);
        }
    }

    private boolean isSlotInPast(AvailabilitySlot slot, LocalDate today, LocalTime now) {
        if (slot.getSlotDate().isBefore(today)) {
            return true;
        }
        return slot.getSlotDate().isEqual(today) && slot.getEndTime().isBefore(now);
    }

    /**
     * BR-017: Slot başlangıcı, şu andan itibaren minimum rezervasyon süresinden önce olmamalıdır.
     */
    private boolean isSlotAfterBookingNotice(AvailabilitySlot slot, LocalDateTime earliestBookable) {
        LocalDateTime slotStart = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        return !slotStart.isBefore(earliestBookable);
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
