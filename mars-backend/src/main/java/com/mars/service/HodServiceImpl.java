package com.mars.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.HodAcademicianDetailDto;
import com.mars.dto.HodAcademicianListDto;
import com.mars.entity.User;
import com.mars.exception.ResourceNotFoundException;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HodServiceImpl implements HodService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HodAcademicianListDto> getDepartmentAcademicians(Integer hodUserId) {
        User hodUser = userRepository.findByIdWithRoleAndDepartment(hodUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        Integer departmentId = hodUser.getDepartment().getDepartmentId();

        List<User> academicians = userRepository.findActiveUsersByDepartmentIdAndRoleNames(
                departmentId,
                Set.of("ACADEMICIAN", "HOD")
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

        User targetUser = userRepository.findByIdWithRoleAndDepartment(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Akademisyen bulunamadı"));

        // Validate that target user belongs to the same department and is active
        if (!targetUser.getDepartment().getDepartmentId().equals(hodUser.getDepartment().getDepartmentId())) {
            throw new ResourceNotFoundException("Akademisyen bulunamadı");
        }

        // Validate role matches
        String roleName = targetUser.getRole().getRoleName();
        if (!"ACADEMICIAN".equals(roleName) && !"HOD".equals(roleName)) {
            throw new ResourceNotFoundException("Akademisyen bulunamadı");
        }

        if (Boolean.FALSE.equals(targetUser.getIsActive())) {
            throw new ResourceNotFoundException("Akademisyen bulunamadı");
        }

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
}
