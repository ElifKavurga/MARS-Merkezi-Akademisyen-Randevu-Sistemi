package com.mars.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.HodAcademicianDetailDto;
import com.mars.dto.HodAcademicianListDto;
import com.mars.dto.HodAcademicianStatsDto;
import com.mars.entity.User;
import com.mars.exception.ResourceNotFoundException;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.UserRepository;

import com.mars.dto.CalendarEventResponseDto;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HodServiceImpl implements HodService {

    private static final Set<String> ALLOWED_ROLES = Set.of("ACADEMICIAN", "HOD");

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
        private final AvailabilitySlotRepository availabilitySlotRepository;
    private final CalendarService calendarService;

    @Override
    @Transactional(readOnly = true)
    public List<HodAcademicianListDto> getDepartmentAcademicians(Integer hodUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        Integer departmentId = hodUser.getDepartment().getDepartmentId();

        List<User> academicians = userRepository.findActiveUsersByDepartmentIdAndRoleNames(
                departmentId,
                ALLOWED_ROLES
        );

        LocalDate today = LocalDate.now();

        return academicians.stream()
                .map(user -> buildHodAcademicianListDto(user, today))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public HodAcademicianDetailDto getDepartmentAcademicianDetail(Integer hodUserId, Integer targetUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        User targetUser = validateSameDepartmentAcademician(hodUser, targetUserId);

        LocalDate today = LocalDate.now();

        long activeOfficeHoursCount = availabilitySlotRepository
                .countByStaff_UserIdAndIsBlockedFalseAndSlotDateGreaterThanEqual(targetUserId, today);
        long todayAppointmentsCount = appointmentRepository
                .countByStaff_UserIdAndSlot_SlotDate(targetUserId, today);
        long pendingAppointmentsCount = appointmentRepository
                .countByStaff_UserIdAndAppointmentStatus(targetUserId, "PENDING");
        long totalAppointmentsCount = appointmentRepository
                .countByStaff_UserId(targetUserId);

        return HodAcademicianDetailDto.builder()
                .userId(targetUserId)
                .fullName(targetUser.getFullName())
                .academicTitle(targetUser.getAcademicTitle())
                .departmentName(targetUser.getDepartment().getDepartmentName())
                .institutionalEmail(targetUser.getInstitutionalEmail())
                .activeOfficeHoursCount(activeOfficeHoursCount)
                .todayAppointmentsCount(todayAppointmentsCount)
                .pendingAppointmentsCount(pendingAppointmentsCount)
                .totalAppointmentsCount(totalAppointmentsCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HodAcademicianStatsDto getDepartmentAcademicianStats(Integer hodUserId, Integer targetUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        validateSameDepartmentAcademician(hodUser, targetUserId);

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        LocalDate yearStart = today.minusMonths(11).withDayOfMonth(1);

        // Status distribution
        List<HodAcademicianStatsDto.StatusCount> statusDistribution = appointmentRepository
                .countByStatusForStaff(targetUserId)
                .stream()
                .map(row -> HodAcademicianStatsDto.StatusCount.builder()
                        .status((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // Category distribution
        List<HodAcademicianStatsDto.CategoryCount> categoryDistribution = appointmentRepository
                .countByCategoryForStaff(targetUserId)
                .stream()
                .map(row -> HodAcademicianStatsDto.CategoryCount.builder()
                        .categoryName((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // Weekly trend (last 7 days) — fill gaps with 0
        java.util.Map<LocalDate, Long> weeklyMap = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            weeklyMap.put(weekStart.plusDays(i), 0L);
        }
        appointmentRepository.countByDayForStaffInRange(targetUserId, weekStart, today)
                .forEach(row -> weeklyMap.put((LocalDate) row[0], (Long) row[1]));
        List<HodAcademicianStatsDto.DayCount> weeklyTrend = weeklyMap.entrySet().stream()
                .map(e -> HodAcademicianStatsDto.DayCount.builder()
                        .date(e.getKey().toString())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());

        // Monthly trend (last 12 months) — fill gaps with 0
        java.util.Map<String, Long> monthlyMap = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 12; i++) {
            LocalDate month = yearStart.plusMonths(i);
            monthlyMap.put(String.format("%04d-%02d", month.getYear(), month.getMonthValue()), 0L);
        }
        appointmentRepository.countByMonthForStaffInRange(targetUserId, yearStart, today)
                .forEach(row -> {
                    String key = String.format("%04d-%02d", ((Number) row[0]).intValue(), ((Number) row[1]).intValue());
                    monthlyMap.put(key, (Long) row[2]);
                });
        List<HodAcademicianStatsDto.MonthCount> monthlyTrend = monthlyMap.entrySet().stream()
                .map(e -> HodAcademicianStatsDto.MonthCount.builder()
                        .yearMonth(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());

        return HodAcademicianStatsDto.builder()
                .statusDistribution(statusDistribution)
                .categoryDistribution(categoryDistribution)
                .weeklyTrend(weeklyTrend)
                .monthlyTrend(monthlyTrend)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Validates that the target user is in the same department as the HOD,
     * has an ACADEMICIAN or HOD role, and is active.
     *
     * @throws ResourceNotFoundException if validation fails
     */
    private User validateSameDepartmentAcademician(User hodUser, Integer targetUserId) {
        User targetUser = userRepository.findByIdWithRoleAndDepartment(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Akademisyen bulunamadı"));

        if (!targetUser.getDepartment().getDepartmentId().equals(hodUser.getDepartment().getDepartmentId())) {
            throw new ResourceNotFoundException("Akademisyen bulunamadı");
        }

        if (!ALLOWED_ROLES.contains(targetUser.getRole().getRoleName())) {
            throw new ResourceNotFoundException("Akademisyen bulunamadı");
        }

        if (Boolean.FALSE.equals(targetUser.getIsActive())) {
            throw new ResourceNotFoundException("Akademisyen bulunamadı");
        }

        return targetUser;
    }

    private HodAcademicianListDto buildHodAcademicianListDto(User user, LocalDate today) {
        Integer userId = user.getUserId();

        long activeOfficeHoursCount = availabilitySlotRepository
                .countByStaff_UserIdAndIsBlockedFalseAndSlotDateGreaterThanEqual(userId, today);
        long todayAppointmentsCount = appointmentRepository
                .countByStaff_UserIdAndSlot_SlotDate(userId, today);
        long pendingAppointmentsCount = appointmentRepository
                .countByStaff_UserIdAndAppointmentStatus(userId, "PENDING");
        long totalAppointmentsCount = appointmentRepository
                .countByStaff_UserId(userId);

        return HodAcademicianListDto.builder()
                .userId(userId)
                .fullName(user.getFullName())
                .academicTitle(user.getAcademicTitle())
                .activeOfficeHoursCount(activeOfficeHoursCount)
                .todayAppointmentsCount(todayAppointmentsCount)
                .pendingAppointmentsCount(pendingAppointmentsCount)
                .totalAppointmentsCount(totalAppointmentsCount)
                .build();
    }
@Override
    @Transactional(readOnly = true)
    public List<CalendarEventResponseDto> getDepartmentAcademicianCalendar(Integer hodUserId, Integer targetUserId, LocalDate from, LocalDate to, boolean includeAppointments) {
        // Validate that the HOD exists
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));
        // Validate target academician belongs to same department and has proper role
        validateSameDepartmentAcademician(hodUser, targetUserId);
        // Fetch calendar events for the academician
        return calendarService.getEventsForStaff(targetUserId, from, to, includeAppointments);
    }
}
