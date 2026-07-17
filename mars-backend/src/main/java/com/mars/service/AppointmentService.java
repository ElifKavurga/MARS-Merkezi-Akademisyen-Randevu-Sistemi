package com.mars.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.AppointmentMessages;
import com.mars.dto.AssistantAppointmentResponseDto;
import com.mars.dto.AppointmentCreateRequest;
import com.mars.dto.AppointmentResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.Course;
import com.mars.entity.StudentPenaltyStatus;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.AppointmentMapper;
import com.mars.repository.AppointmentCategoryRepository;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.CourseRepository;
import com.mars.repository.StudentPenaltyStatusRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AppointmentCategoryRepository appointmentCategoryRepository;
    private final CourseRepository courseRepository;
    private final StudentPenaltyStatusRepository studentPenaltyStatusRepository;
    private final AppointmentMapper appointmentMapper;

    @Transactional
    public AppointmentResponseDto createAppointment(AppointmentCreateRequest request) {
        User student = getCurrentStudent();

        if (request.getSlotId() == null) {
            throw new BadRequestException(AppointmentMessages.SLOT_REQUIRED);
        }
        if (request.getCategoryId() == null) {
            throw new BadRequestException(AppointmentMessages.CATEGORY_REQUIRED);
        }

        ensureStudentNotRestricted(student.getUserId());

        AvailabilitySlot slot = availabilitySlotRepository.findByIdWithStaff(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.SLOT_NOT_FOUND));

        if (Boolean.TRUE.equals(slot.getIsBlocked())) {
            throw new ConflictException(AppointmentMessages.SLOT_BLOCKED);
        }
        if (isSlotInPast(slot)) {
            throw new BadRequestException(AppointmentMessages.SLOT_PAST);
        }
        if (appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(
                slot.getSlotId(), ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException(AppointmentMessages.SLOT_TAKEN);
        }
        if (appointmentRepository.existsOverlappingActiveAppointmentForStudent(
                student.getUserId(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException(AppointmentMessages.TIME_OVERLAP);
        }

        AppointmentCategory category = appointmentCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.CATEGORY_NOT_FOUND));

        Course course = resolveCourse(request.getCourseId(), category, slot.getStaff());
        String meetingType = resolveAppointmentMeetingType(slot.getMeetingType(), request.getMeetingType());

        Appointment appointment = appointmentMapper.toEntity(
                request, student, slot, category, course, meetingType);
        Appointment saved = appointmentRepository.save(appointment);
        return appointmentMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AssistantAppointmentResponseDto> getAssistantAppointments(String status) {
        User assistant = getCurrentAssistant();
        String resolvedStatus = resolveStatusFilter(status);

        return appointmentRepository.findAllByStaffIdWithDetails(
                        assistant.getUserId(), resolvedStatus)
                .stream()
                .sorted(assistantAppointmentComparator())
                .map(appointmentMapper::toAssistantResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssistantAppointmentResponseDto getAssistantAppointment(Integer appointmentId) {
        User assistant = getCurrentAssistant();
        Appointment appointment = appointmentRepository.findByIdAndStaffIdWithDetails(
                        appointmentId, assistant.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND));
        return appointmentMapper.toAssistantResponse(appointment);
    }

    private Course resolveCourse(Integer courseId, AppointmentCategory category, User staff) {
        boolean requiresCourse = Boolean.TRUE.equals(category.getRequiresCourseSelection());
        if (requiresCourse) {
            if (courseId == null) {
                throw new BadRequestException(AppointmentMessages.COURSE_REQUIRED);
            }
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.COURSE_NOT_FOUND));
            if (course.getOwnerAcademician() == null
                    || !Objects.equals(course.getOwnerAcademician().getUserId(), staff.getUserId())) {
                throw new BadRequestException(AppointmentMessages.COURSE_STAFF_MISMATCH);
            }
            return course;
        }
        if (courseId != null) {
            throw new BadRequestException(AppointmentMessages.COURSE_NOT_ALLOWED);
        }
        return null;
    }

    private String resolveAppointmentMeetingType(String slotMeetingType, String requestedMeetingType) {
        MeetingType slotType = parseSlotMeetingType(slotMeetingType);

        if (slotType == MeetingType.FACE_TO_FACE) {
            if (requestedMeetingType != null
                    && !requestedMeetingType.isBlank()
                    && !MeetingType.FACE_TO_FACE.name().equalsIgnoreCase(requestedMeetingType.trim())) {
                throw new BadRequestException(AppointmentMessages.MEETING_TYPE_NOT_ALLOWED);
            }
            return MeetingType.FACE_TO_FACE.name();
        }

        if (slotType == MeetingType.ONLINE) {
            if (requestedMeetingType != null
                    && !requestedMeetingType.isBlank()
                    && !MeetingType.ONLINE.name().equalsIgnoreCase(requestedMeetingType.trim())) {
                throw new BadRequestException(AppointmentMessages.MEETING_TYPE_NOT_ALLOWED);
            }
            return MeetingType.ONLINE.name();
        }

        // BOTH
        if (requestedMeetingType == null || requestedMeetingType.isBlank()) {
            throw new BadRequestException(AppointmentMessages.MEETING_TYPE_REQUIRED);
        }
        MeetingType selected;
        try {
            selected = MeetingType.valueOf(requestedMeetingType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(AppointmentMessages.INVALID_MEETING_TYPE);
        }
        if (selected != MeetingType.FACE_TO_FACE && selected != MeetingType.ONLINE) {
            throw new BadRequestException(AppointmentMessages.INVALID_MEETING_TYPE);
        }
        return selected.name();
    }

    private MeetingType parseSlotMeetingType(String meetingType) {
        if (meetingType == null || meetingType.isBlank()) {
            return MeetingType.FACE_TO_FACE;
        }
        try {
            return MeetingType.valueOf(meetingType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return MeetingType.FACE_TO_FACE;
        }
    }

    private void ensureStudentNotRestricted(Integer studentId) {
        studentPenaltyStatusRepository.findById(studentId).ifPresent(this::assertNotActivelyRestricted);
    }

    private void assertNotActivelyRestricted(StudentPenaltyStatus status) {
        if (!Boolean.TRUE.equals(status.getIsRestricted())) {
            return;
        }
        LocalDate endDate = status.getRestrictionEndDate();
        if (endDate == null || !endDate.isBefore(LocalDate.now())) {
            throw new ConflictException(AppointmentMessages.STUDENT_RESTRICTED);
        }
    }

    private boolean isSlotInPast(AvailabilitySlot slot) {
        LocalDate today = LocalDate.now();
        if (slot.getSlotDate().isBefore(today)) {
            return true;
        }
        return slot.getSlotDate().isEqual(today) && slot.getEndTime().isBefore(LocalTime.now());
    }

    private User getCurrentStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        User user = userDetails.getUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!RoleType.STUDENT.name().equals(roleName)) {
            throw new AccessDeniedException(AppointmentMessages.ONLY_STUDENT);
        }
        return user;
    }

    private User getCurrentAssistant() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        User user = userDetails.getUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!RoleType.ASSISTANT.name().equals(roleName)) {
            throw new AccessDeniedException(AppointmentMessages.ONLY_ASSISTANT);
        }
        return user;
    }

    private String resolveStatusFilter(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return AppointmentStatus.valueOf(status.trim().toUpperCase(Locale.ROOT)).name();
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(AppointmentMessages.INVALID_STATUS);
        }
    }

    private Comparator<Appointment> assistantAppointmentComparator() {
        return (left, right) -> {
            boolean leftPast = isAppointmentInPast(left);
            boolean rightPast = isAppointmentInPast(right);
            if (leftPast != rightPast) {
                return leftPast ? 1 : -1;
            }

            int dateComparison = left.getSlot().getSlotDate()
                    .compareTo(right.getSlot().getSlotDate());
            if (dateComparison == 0) {
                dateComparison = left.getSlot().getStartTime()
                        .compareTo(right.getSlot().getStartTime());
            }
            return leftPast ? -dateComparison : dateComparison;
        };
    }

    private boolean isAppointmentInPast(Appointment appointment) {
        AvailabilitySlot slot = appointment.getSlot();
        LocalDate today = LocalDate.now();
        if (slot.getSlotDate().isBefore(today)) {
            return true;
        }
        return slot.getSlotDate().isEqual(today)
                && slot.getEndTime().isBefore(LocalTime.now());
    }
}
