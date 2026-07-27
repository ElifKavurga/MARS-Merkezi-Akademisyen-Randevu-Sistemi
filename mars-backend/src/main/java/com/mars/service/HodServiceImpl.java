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
import com.mars.dto.HodDepartmentKpiDto;
import com.mars.dto.HodPerformanceSummaryDto;
import com.mars.dto.HodRecentAppointmentDto;
import com.mars.entity.User;
import com.mars.entity.Appointment;
import org.springframework.data.domain.PageRequest;
import com.mars.exception.ResourceNotFoundException;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.UserRepository;
import com.mars.repository.WaitlistEntryRepository;
import com.mars.dto.HodDepartmentAnalysisDto;
import com.mars.dto.CalendarEventResponseDto;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HodServiceImpl implements HodService {

    private static final Set<String> ALLOWED_ROLES = Set.of("ACADEMICIAN", "HOD");

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final WaitlistEntryRepository waitlistEntryRepository;
    private final CalendarService calendarService;

    @Override
    @Transactional(readOnly = true)
    public List<HodAcademicianListDto> getDepartmentAcademicians(Integer hodUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));

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
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));

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
                .fullName(targetUser.getDisplayName())
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
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));

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

        // Weekly trend (last 7 days) â€” fill gaps with 0
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

        // Monthly trend (last 12 months) â€” fill gaps with 0
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

    // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Validates that the target user is in the same department as the HOD,
     * has an ACADEMICIAN or HOD role, and is active.
     *
     * @throws ResourceNotFoundException if validation fails
     */
    private User validateSameDepartmentAcademician(User hodUser, Integer targetUserId) {
        User targetUser = userRepository.findByIdWithRoleAndDepartment(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Akademisyen bulunamadÄ±"));

        if (!targetUser.getDepartment().getDepartmentId().equals(hodUser.getDepartment().getDepartmentId())) {
            throw new ResourceNotFoundException("Akademisyen bulunamadÄ±");
        }

        if (!ALLOWED_ROLES.contains(targetUser.getRole().getRoleName())) {
            throw new ResourceNotFoundException("Akademisyen bulunamadÄ±");
        }

        if (Boolean.FALSE.equals(targetUser.getIsActive())) {
            throw new ResourceNotFoundException("Akademisyen bulunamadÄ±");
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
                .fullName(user.getDisplayName())
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
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));
        // Validate target academician belongs to same department and has proper role
        validateSameDepartmentAcademician(hodUser, targetUserId);
        // Fetch calendar events for the academician
        return calendarService.getEventsForStaff(targetUserId, from, to, includeAppointments);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HodRecentAppointmentDto> getDepartmentAcademicianRecentAppointments(Integer hodUserId, Integer targetUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));
        validateSameDepartmentAcademician(hodUser, targetUserId);

        List<Appointment> recentAppointments = appointmentRepository.findRecentByStaffIdWithDetails(targetUserId, PageRequest.of(0, 10));
        
        return recentAppointments.stream().map(a -> HodRecentAppointmentDto.builder()
                .appointmentId(a.getAppointmentId())
                .date(a.getSlot().getSlotDate().toString())
                .startTime(a.getSlot().getStartTime().toString())
                .endTime(a.getSlot().getEndTime().toString())
                .studentName(a.getStudent().getDisplayName())
                .categoryName(a.getCategory().getCategoryName())
                .status(a.getAppointmentStatus())
                .meetingType(a.getMeetingType())
                .durationMinutes(java.time.temporal.ChronoUnit.MINUTES.between(a.getSlot().getStartTime(), a.getSlot().getEndTime()))
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public HodPerformanceSummaryDto getDepartmentAcademicianPerformanceSummary(Integer hodUserId, Integer targetUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));
        validateSameDepartmentAcademician(hodUser, targetUserId);

        long totalAppointments = appointmentRepository.countByStaff_UserId(targetUserId);
        long completedAppointments = appointmentRepository.countByStaff_UserIdAndAppointmentStatus(targetUserId, "COMPLETED");
        long noShowAppointments = appointmentRepository.countByStaff_UserIdAndAppointmentStatus(targetUserId, "NO_SHOW");

        double noShowRate = totalAppointments > 0 ? (noShowAppointments / (double) totalAppointments) * 100 : 0.0;
        double averageDaily = completedAppointments / 30.0; // Placeholder calculation

        return HodPerformanceSummaryDto.builder()
                .totalCompleted(completedAppointments)
                .averageDaily(Math.round(averageDaily * 10.0) / 10.0)
                .noShowCount(noShowAppointments)
                .noShowRate(Math.round(noShowRate * 10.0) / 10.0)
                .averageResponseTime("2 Saat") // Placeholder
                .busiestDay("Ã‡arÅŸamba") // Placeholder
                .busiestTimeRange("14:00 - 15:00") // Placeholder
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HodDepartmentKpiDto getDepartmentKpiStats(Integer hodUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));

        Integer departmentId = hodUser.getDepartment().getDepartmentId();
        LocalDate today = LocalDate.now();

        long totalAcademicians = userRepository.countByDepartment_DepartmentIdAndRole_RoleNameIn(departmentId, ALLOWED_ROLES);
        long activeAcademicians = userRepository.countByDepartment_DepartmentIdAndRole_RoleNameInAndIsActiveTrue(departmentId, ALLOWED_ROLES);
        long totalAppointments = appointmentRepository.countByStaff_Department_DepartmentId(departmentId);
        long todayAppointments = appointmentRepository.countByStaff_Department_DepartmentIdAndSlot_SlotDate(departmentId, today);
        long pendingAppointments = appointmentRepository.countByStaff_Department_DepartmentIdAndAppointmentStatus(departmentId, "PENDING");
        long completedAppointments = appointmentRepository.countByStaff_Department_DepartmentIdAndAppointmentStatus(departmentId, "COMPLETED");
        long noShowCount = appointmentRepository.countByStaff_Department_DepartmentIdAndAppointmentStatus(departmentId, "NO_SHOW");
        long waitlistStudentCount = 12L; // Placeholder data

        return HodDepartmentKpiDto.builder()
                .totalAcademicians(totalAcademicians)
                .activeAcademicians(activeAcademicians)
                .totalAppointments(totalAppointments)
                .todayAppointments(todayAppointments)
                .pendingAppointments(pendingAppointments)
                .completedAppointments(completedAppointments)
                .noShowCount(noShowCount)
                .waitlistStudentCount(waitlistStudentCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.mars.dto.HodDepartmentStatsDto getDepartmentStats(Integer hodUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));

        Integer departmentId = hodUser.getDepartment().getDepartmentId();
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        LocalDate yearStart = today.minusMonths(11).withDayOfMonth(1);

        // Status distribution
        List<com.mars.dto.HodDepartmentStatsDto.StatusCount> statusDistribution = appointmentRepository
                .countByStatusForDepartment(departmentId)
                .stream()
                .map(row -> com.mars.dto.HodDepartmentStatsDto.StatusCount.builder()
                        .status((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // Category distribution
        List<com.mars.dto.HodDepartmentStatsDto.CategoryCount> categoryDistribution = appointmentRepository
                .countByCategoryForDepartment(departmentId)
                .stream()
                .map(row -> com.mars.dto.HodDepartmentStatsDto.CategoryCount.builder()
                        .categoryName((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // Weekly trend (last 7 days) â€” fill gaps with 0
        java.util.Map<LocalDate, Long> weeklyMap = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            weeklyMap.put(weekStart.plusDays(i), 0L);
        }
        appointmentRepository.countByDayForDepartmentInRange(departmentId, weekStart, today)
                .forEach(row -> weeklyMap.put((LocalDate) row[0], (Long) row[1]));
        List<com.mars.dto.HodDepartmentStatsDto.DayCount> weeklyTrend = weeklyMap.entrySet().stream()
                .map(e -> com.mars.dto.HodDepartmentStatsDto.DayCount.builder()
                        .date(e.getKey().toString())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());

        // Monthly trend (last 12 months) â€” fill gaps with 0
        java.util.Map<String, Long> monthlyMap = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 12; i++) {
            LocalDate month = yearStart.plusMonths(i);
            monthlyMap.put(String.format("%04d-%02d", month.getYear(), month.getMonthValue()), 0L);
        }
        appointmentRepository.countByMonthForDepartmentInRange(departmentId, yearStart, today)
                .forEach(row -> {
                    String key = String.format("%04d-%02d", ((Number) row[0]).intValue(), ((Number) row[1]).intValue());
                    monthlyMap.put(key, (Long) row[2]);
                });
        List<com.mars.dto.HodDepartmentStatsDto.MonthCount> monthlyTrend = monthlyMap.entrySet().stream()
                .map(e -> com.mars.dto.HodDepartmentStatsDto.MonthCount.builder()
                        .yearMonth(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());

        return com.mars.dto.HodDepartmentStatsDto.builder()
                .statusDistribution(statusDistribution)
                .categoryDistribution(categoryDistribution)
                .weeklyTrend(weeklyTrend)
                .monthlyTrend(monthlyTrend)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HodDepartmentAnalysisDto getDepartmentAnalysis(Integer hodUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("KullanÄ±cÄ± bulunamadÄ±"));

        Integer departmentId = hodUser.getDepartment().getDepartmentId();
        
        // --- No-Show Analysis ---
        long totalAppointments = appointmentRepository.countByStaff_Department_DepartmentId(departmentId);
        long totalNoShow = appointmentRepository.countByStaff_Department_DepartmentIdAndAppointmentStatus(departmentId, "NO_SHOW");
        double noShowRate = totalAppointments > 0 ? ((double) totalNoShow / totalAppointments) * 100 : 0.0;
        
        String mostNoShowDay = "-";
        List<Object[]> noShowDates = appointmentRepository.countBySlotDateAndStatusForDepartment(departmentId, "NO_SHOW");
        if (!noShowDates.isEmpty()) {
            java.util.Map<String, Long> dayNameMap = new java.util.HashMap<>();
            for (Object[] row : noShowDates) {
                LocalDate date = (LocalDate) row[0];
                Long count = (Long) row[1];
                String dayName = date.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, new java.util.Locale("tr", "TR"));
                dayNameMap.put(dayName, dayNameMap.getOrDefault(dayName, 0L) + count);
            }
            mostNoShowDay = dayNameMap.entrySet().stream()
                    .max(java.util.Map.Entry.comparingByValue())
                    .map(java.util.Map.Entry::getKey)
                    .orElse("-");
        }

        String mostNoShowTimeRange = "-";
        List<Object[]> noShowTimes = appointmentRepository.countByStartTimeAndStatusForDepartment(departmentId, "NO_SHOW");
        if (!noShowTimes.isEmpty()) {
            mostNoShowTimeRange = noShowTimes.get(0)[0].toString();
        }

        HodDepartmentAnalysisDto.NoShowAnalysis noShowAnalysis = HodDepartmentAnalysisDto.NoShowAnalysis.builder()
                .totalNoShow(totalNoShow)
                .noShowRate(noShowRate)
                .mostNoShowDay(mostNoShowDay)
                .mostNoShowTimeRange(mostNoShowTimeRange)
                .build();

        // --- Waitlist Analysis ---
        long totalWaitlistStudents = waitlistEntryRepository.countByStaff_Department_DepartmentId(departmentId);
        long convertedToAppointmentCount = waitlistEntryRepository.countByStaff_Department_DepartmentIdAndWaitlistStatus(departmentId, "BOOKED");
        
        List<String> topWaitlistCategories = waitlistEntryRepository.countByCategoryForDepartment(departmentId)
                .stream()
                .limit(3)
                .map(row -> (String) row[0])
                .collect(Collectors.toList());

        HodDepartmentAnalysisDto.WaitlistAnalysis waitlistAnalysis = HodDepartmentAnalysisDto.WaitlistAnalysis.builder()
                .totalWaitlistStudents(totalWaitlistStudents)
                .topWaitlistCategories(topWaitlistCategories)
                .convertedToAppointmentCount(convertedToAppointmentCount)
                .averageWaitTime("Veri yok") // Mock average wait time
                .build();

        // --- General Analysis ---
        String busiestAcademician = "-";
        List<Object[]> staffCounts = appointmentRepository.countByStaffForDepartment(departmentId);
        if (!staffCounts.isEmpty()) {
            busiestAcademician = (String) staffCounts.get(0)[0];
        }

        // Calculate averages based on some simple logic for demonstration
        long totalActiveAcademicians = userRepository.countByDepartment_DepartmentIdAndRole_RoleNameInAndIsActiveTrue(departmentId, List.of("ACADEMICIAN"));
        double avgDailyAppointments = totalActiveAcademicians > 0 ? (double) totalAppointments / (totalActiveAcademicians * 30) : 0.0;
        double avgWeeklyAppointments = totalActiveAcademicians > 0 ? (double) totalAppointments / (totalActiveAcademicians * 4) : 0.0;
        
        String busiestCategory = "-";
        List<Object[]> categoryCounts = appointmentRepository.countByCategoryForDepartment(departmentId);
        if (!categoryCounts.isEmpty()) {
            busiestCategory = (String) categoryCounts.get(0)[0];
        }

        String busiestDay = "-";
        List<Object[]> dayDates = appointmentRepository.countBySlotDateForDepartment(departmentId);
        if (!dayDates.isEmpty()) {
            java.util.Map<String, Long> dayNameMap = new java.util.HashMap<>();
            for (Object[] row : dayDates) {
                LocalDate date = (LocalDate) row[0];
                Long count = (Long) row[1];
                String dayName = date.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, new java.util.Locale("tr", "TR"));
                dayNameMap.put(dayName, dayNameMap.getOrDefault(dayName, 0L) + count);
            }
            busiestDay = dayNameMap.entrySet().stream()
                    .max(java.util.Map.Entry.comparingByValue())
                    .map(java.util.Map.Entry::getKey)
                    .orElse("-");
        }

        String busiestTimeRange = "-";
        List<Object[]> timeCounts = appointmentRepository.countByStartTimeForDepartment(departmentId);
        if (!timeCounts.isEmpty()) {
            busiestTimeRange = timeCounts.get(0)[0].toString();
        }

        HodDepartmentAnalysisDto.GeneralAnalysis generalAnalysis = HodDepartmentAnalysisDto.GeneralAnalysis.builder()
                .busiestAcademician(busiestAcademician)
                .avgDailyAppointments(avgDailyAppointments)
                .avgWeeklyAppointments(avgWeeklyAppointments)
                .busiestCategory(busiestCategory)
                .busiestDay(busiestDay)
                .busiestTimeRange(busiestTimeRange)
                .build();

        return HodDepartmentAnalysisDto.builder()
                .noShowAnalysis(noShowAnalysis)
                .waitlistAnalysis(waitlistAnalysis)
                .generalAnalysis(generalAnalysis)
                .build();
    }
}
