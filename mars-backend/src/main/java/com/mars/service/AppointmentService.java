package com.mars.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.AppointmentConstraints;
import com.mars.AppointmentMessages;
import com.mars.dto.AppointmentCreateRequest;
import com.mars.dto.AppointmentRescheduleRequest;
import com.mars.dto.AppointmentRescheduleResponse;
import com.mars.dto.AppointmentResponseDto;
import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.dto.StudentPenaltyStatusResponse;
import com.mars.dto.StudentAppointmentResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentRescheduleApproval;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.Course;
import com.mars.entity.DelegationLog;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.RescheduleRequestStatus;
import com.mars.enums.MeetingType;
import com.mars.enums.NotificationType;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.exception.StudentAppointmentRestrictedException;
import com.mars.mapper.AppointmentMapper;
import com.mars.repository.AppointmentCategoryRepository;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AppointmentRescheduleRequestRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.repository.CourseRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.repository.OutOfOfficePeriodRepository;
import com.mars.repository.StudentPenaltyStatusRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final long RESCHEDULE_APPROVAL_HOURS = 2;
    private static final DateTimeFormatter NOTIFICATION_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter NOTIFICATION_TIME = DateTimeFormatter.ofPattern("HH:mm");

    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    private static final Set<String> PAST_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.COMPLETED.name(),
            AppointmentStatus.CANCELLED.name(),
            AppointmentStatus.REJECTED.name(),
            AppointmentStatus.NO_SHOW.name());

    private static final Set<String> BOOKABLE_STAFF_ROLES = Set.of(
            RoleType.ACADEMICIAN.name(),
            RoleType.HOD.name(),
            RoleType.ASSISTANT.name());

    private final AppointmentRepository appointmentRepository;
    private final AppointmentRescheduleRequestRepository appointmentRescheduleRequestRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AppointmentCategoryRepository appointmentCategoryRepository;
    private final CourseRepository courseRepository;
    private final CourseAssignmentRepository courseAssignmentRepository;
    private final StudentPenaltyStatusRepository studentPenaltyStatusRepository;
    private final OutOfOfficePeriodRepository outOfOfficePeriodRepository;
    private final AppointmentMapper appointmentMapper;
    private final AvailabilitySlotService availabilitySlotService;
    private final DelegationLogRepository delegationLogRepository;
    private final NotificationService notificationService;
    private final WaitlistService waitlistService;
    private final NoShowPenaltyService noShowPenaltyService;

    @Transactional
    public AppointmentResponseDto createAppointment(AppointmentCreateRequest request) {
        User student = getCurrentStudent();

        if (request.getSlotId() == null) {
            throw new BadRequestException(AppointmentMessages.SLOT_REQUIRED);
        }
        if (request.getCategoryId() == null) {
            throw new BadRequestException(AppointmentMessages.CATEGORY_REQUIRED);
        }

        ensureStudentNotRestricted(student);

        // Race condition: slot satırını kilitle, ardından müsaitlik son kez doğrulanır.
        AvailabilitySlot templateSlot = availabilitySlotRepository.findByIdWithStaffForUpdate(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.SLOT_NOT_FOUND));

        User staff = templateSlot.getStaff();
        ensureStaffIsBookable(staff);

        // Resolve requested date/time
        LocalDate bookingDate = request.getAppointmentDate() != null ? request.getAppointmentDate() : templateSlot.getSlotDate();
        LocalTime bookingStart = request.getStartTime() != null ? request.getStartTime() : templateSlot.getStartTime();
        LocalTime bookingEnd = request.getEndTime() != null ? request.getEndTime() : templateSlot.getEndTime();

        AvailabilitySlot slot = resolveRequestedAvailability(
                templateSlot, staff, bookingDate, bookingStart, bookingEnd);

        ensureSlotBookable(slot, staff.getUserId());

        if (appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(
                slot.getSlotId(), ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException(AppointmentMessages.SLOT_TAKEN);
        }

        if (delegationLogRepository.existsActiveSlotLock(
                staff.getUserId(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                LocalDateTime.now(APP_ZONE),
                null)) {
            throw new ConflictException(AppointmentMessages.SLOT_TAKEN);
        }

        if (appointmentRescheduleRequestRepository.existsActiveSlotLock(
                staff.getUserId(), slot.getSlotDate(), slot.getStartTime(), slot.getEndTime(),
                LocalDateTime.now(APP_ZONE))) {
            throw new ConflictException(AppointmentMessages.SLOT_TAKEN);
        }

        if (appointmentRepository.existsOverlappingActiveAppointmentForStaff(
                staff.getUserId(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                ACTIVE_APPOINTMENT_STATUSES)) {
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

        Course course = resolveCourse(request.getCourseId(), category, staff);
        String meetingType = resolveAppointmentMeetingType(slot.getMeetingType(), request.getMeetingType());

        Appointment appointment = appointmentMapper.toEntity(
                request, student, slot, category, course, meetingType);
        Appointment saved = appointmentRepository.save(appointment);
        createAppointmentNotification(
                saved,
                staff,
                NotificationType.NEW_APPOINTMENT_REQUEST,
                "Yeni Randevu Talebi",
                "Yeni bir randevu talebiniz bulunuyor.");
        return appointmentMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<StudentAppointmentResponseDto> getStudentActiveAppointments() {
        User student = getCurrentStudent();
        return appointmentRepository.findActiveByStudentIdWithDetails(
                        student.getUserId(), ACTIVE_APPOINTMENT_STATUSES)
                .stream()
                .map(appointment -> withStudentDelegationState(
                        appointmentMapper.toStudentResponse(appointment),
                        appointment.getAppointmentId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentAppointmentResponseDto> getStudentPastAppointments() {
        User student = getCurrentStudent();
        return appointmentRepository.findPastByStudentIdWithDetails(
                        student.getUserId(), PAST_APPOINTMENT_STATUSES)
                .stream()
                .map(appointmentMapper::toStudentResponse)
                .toList();
    }

    @Transactional
    public StudentPenaltyStatusResponse getCurrentStudentPenaltyStatus() {
        User student = getCurrentStudent();
        return noShowPenaltyService.getStudentPenaltyStatus(student, LocalDate.now(APP_ZONE));
    }

    @Transactional(readOnly = true)
    public StudentAppointmentResponseDto getStudentAppointment(Integer appointmentId) {
        User student = getCurrentStudent();
        Appointment appointment = appointmentRepository.findByIdAndStudentIdWithDetails(
                        appointmentId, student.getUserId())
                .orElseThrow(() -> ownershipException(
                        appointmentId, AppointmentMessages.STUDENT_APPOINTMENT_ACCESS_DENIED));
        StudentAppointmentResponseDto dto = withStudentDelegationState(
                appointmentMapper.toStudentResponse(appointment),
                appointmentId);

        List<DelegationLog> delegations = delegationLogRepository
                .findByAppointment_AppointmentIdAndDelegationStatusOrderByUpdatedAtDesc(
                        appointmentId, "ACCEPTED");
        if (!delegations.isEmpty()) {
            DelegationLog latest = delegations.get(0);
            dto.setIsDelegated(true);
            dto.setDelegatedFromStaffName(latest.getDelegatedByUser().getFullName());
            dto.setDelegatedToStaffName(latest.getDelegatedToUser().getFullName());
            dto.setDelegationDate(latest.getUpdatedAt());
        } else {
            dto.setIsDelegated(false);
        }

        return dto;
    }

    private StudentAppointmentResponseDto withStudentDelegationState(
            StudentAppointmentResponseDto dto,
            Integer appointmentId) {
        List<DelegationLog> pending = delegationLogRepository
                .findByAppointment_AppointmentIdAndDelegationStatusOrderByUpdatedAtDesc(
                        appointmentId, "PENDING_STUDENT_APPROVAL");
        if (!pending.isEmpty()) {
            DelegationLog latest = pending.get(0);
            dto.setPendingDelegationId(latest.getDelegationId());
            dto.setPendingDelegationStatus(latest.getDelegationStatus());
            dto.setPendingDelegationFromStaffName(latest.getDelegatedByUser().getFullName());
            dto.setPendingDelegationToStaffName(latest.getDelegatedToUser().getFullName());
            dto.setPendingDelegationExpiresAt(latest.getStudentApprovalExpiresAt());
        }
        return dto;
    }

    @Transactional
    public StudentAppointmentResponseDto cancelStudentAppointment(Integer appointmentId) {
        User student = getCurrentStudent();
        Appointment appointment = appointmentRepository.findByIdAndStudentIdForUpdate(
                        appointmentId, student.getUserId())
                .orElseThrow(() -> ownershipException(
                        appointmentId, AppointmentMessages.CANCEL_ACCESS_DENIED));

        validateStudentCancellable(appointment);
        appointment.setAppointmentStatus(AppointmentStatus.CANCELLED.name());
        appointment.setUpdatedAt(LocalDateTime.now(APP_ZONE));

        Appointment saved = appointmentRepository.save(appointment);
        createAppointmentNotification(
                saved,
                appointment.getStaff(),
                NotificationType.APPOINTMENT_CANCELLED,
                "Randevu İptal Edildi",
                buildStudentCancellationMessage(appointment));
        waitlistService.processWaitlistForSlot(saved.getSlot(), LocalDateTime.now(APP_ZONE));
        return appointmentRepository.findByIdAndStudentIdWithDetails(
                        saved.getAppointmentId(), student.getUserId())
                .map(appointmentMapper::toStudentResponse)
                .orElseGet(() -> appointmentMapper.toStudentResponse(saved));
    }

    @Transactional(readOnly = true)
    public List<StaffAppointmentResponseDto> getStaffAppointments(
            String status,
            RoleType requiredRole) {
        User staff = getCurrentStaff(requiredRole);
        String resolvedStatus = resolveStatusFilter(status);

        return appointmentRepository.findAllByStaffIdWithDetails(
                        staff.getUserId(), resolvedStatus)
                .stream()
                .sorted(staffAppointmentComparator())
                .map(appointmentMapper::toStaffResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StaffAppointmentResponseDto getStaffAppointment(
            Integer appointmentId,
            RoleType requiredRole) {
        User staff = getCurrentStaff(requiredRole);
        Appointment appointment = appointmentRepository.findByIdAndStaffIdWithDetails(
                        appointmentId, staff.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND));
        return appointmentMapper.toStaffResponse(appointment);
    }

    @Transactional
    public StaffAppointmentResponseDto approveStaffAppointment(
            Integer appointmentId,
            RoleType requiredRole) {
        return updateStaffAppointmentStatus(
                appointmentId, AppointmentStatus.APPROVED, requiredRole);
    }

    @Transactional
    public StaffAppointmentResponseDto rejectStaffAppointment(
            Integer appointmentId,
            RoleType requiredRole) {
        return updateStaffAppointmentStatus(
                appointmentId, AppointmentStatus.REJECTED, requiredRole);
    }

    @Transactional
    public StaffAppointmentResponseDto completeStaffAppointment(
            Integer appointmentId,
            RoleType requiredRole) {
        User staff = getCurrentStaff(requiredRole);
        Appointment appointment = appointmentRepository.findByIdAndStaffIdForUpdate(
                        appointmentId, staff.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND));

        validateEndableStatus(appointment.getAppointmentStatus());
        appointment.setAppointmentStatus(AppointmentStatus.COMPLETED.name());
        appointment.setUpdatedAt(LocalDateTime.now(APP_ZONE));

        Appointment saved = appointmentRepository.save(appointment);
        return appointmentMapper.toStaffResponse(saved);
    }

    @Transactional
    public StaffAppointmentResponseDto markStaffAppointmentNoShow(
            Integer appointmentId,
            RoleType requiredRole) {
        User staff = getCurrentStaff(requiredRole);
        Appointment appointment = noShowPenaltyService.markStaffAppointmentAsNoShow(
                appointmentId,
                staff.getUserId(),
                LocalDateTime.now(APP_ZONE));
        return appointmentMapper.toStaffResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponseDto> getStaffAppointmentRescheduleSlots(
            Integer appointmentId,
            RoleType requiredRole) {
        User staff = getCurrentStaff(requiredRole);
        Appointment appointment = appointmentRepository.findByIdAndStaffIdWithDetails(
                        appointmentId, staff.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND));

        validateReschedulableStatus(appointment.getAppointmentStatus());
        return availabilitySlotService.getBookableAvailableSlotsForStaff(
                staff.getUserId(), appointment.getCategory().getDurationMinutes(), true);
    }

    @Transactional
    public AppointmentRescheduleResponse rescheduleStaffAppointment(
            Integer appointmentId,
            AppointmentRescheduleRequest request,
            RoleType requiredRole) {
        User staff = getCurrentStaff(requiredRole);
        Appointment appointment = appointmentRepository.findByIdAndStaffIdForUpdate(
                        appointmentId, staff.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND));

        validateReschedulableStatus(appointment.getAppointmentStatus());
        appointmentRescheduleRequestRepository.findByAppointment_AppointmentIdAndRequestStatus(
                appointmentId, RescheduleRequestStatus.PENDING.name()).ifPresent(existing -> {
                    LocalDateTime now = LocalDateTime.now(APP_ZONE);
                    if (existing.getExpiresAt().isAfter(now)) {
                        throw new ConflictException(AppointmentMessages.RESCHEDULE_ALREADY_PENDING);
                    }
                    expireReschedule(existing, now);
                });

        boolean selectedSlotIsAvailable = availabilitySlotService
                .getBookableAvailableSlotsForStaff(
                        staff.getUserId(), appointment.getCategory().getDurationMinutes(), true)
                .stream()
                .anyMatch(slot -> !Boolean.TRUE.equals(slot.getIsBooked())
                        && Objects.equals(slot.getSlotId(), request.getSlotId())
                        && Objects.equals(slot.getSlotDate(), request.getAppointmentDate())
                        && Objects.equals(slot.getStartTime(), request.getStartTime())
                        && Objects.equals(slot.getEndTime(), request.getEndTime()));
        if (!selectedSlotIsAvailable) {
            throw new ConflictException(AppointmentMessages.SLOT_TAKEN);
        }

        AvailabilitySlot templateSlot = availabilitySlotRepository
                .findByIdWithStaffForUpdate(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.SLOT_NOT_FOUND));
        if (!Objects.equals(templateSlot.getStaff().getUserId(), staff.getUserId())) {
            throw new ResourceNotFoundException(AppointmentMessages.SLOT_NOT_FOUND);
        }

        AvailabilitySlot targetSlot = resolveRequestedAvailability(
                templateSlot,
                staff,
                request.getAppointmentDate(),
                request.getStartTime(),
                request.getEndTime());
        ensureSlotBookable(targetSlot, staff.getUserId());

        if (appointmentRepository.existsOverlappingActiveAppointmentForStudentExcludingAppointment(
                appointment.getStudent().getUserId(),
                targetSlot.getSlotDate(),
                targetSlot.getStartTime(),
                targetSlot.getEndTime(),
                appointmentId,
                ACTIVE_APPOINTMENT_STATUSES)) {
            throw new ConflictException(AppointmentMessages.TIME_OVERLAP);
        }

        if (appointmentRepository.existsActiveAppointmentForSlotExcludingAppointment(
                targetSlot.getSlotId(), appointmentId, ACTIVE_APPOINTMENT_STATUSES)
                || appointmentRepository.existsOverlappingActiveAppointmentForStaffExcludingAppointment(
                        staff.getUserId(),
                        targetSlot.getSlotDate(),
                        targetSlot.getStartTime(),
                        targetSlot.getEndTime(),
                        appointmentId,
                        ACTIVE_APPOINTMENT_STATUSES)
                || delegationLogRepository.existsActiveSlotLock(
                        staff.getUserId(),
                        targetSlot.getSlotDate(),
                        targetSlot.getStartTime(),
                        targetSlot.getEndTime(),
                        LocalDateTime.now(APP_ZONE),
                        null)
                || appointmentRescheduleRequestRepository.existsActiveSlotLock(
                        staff.getUserId(), targetSlot.getSlotDate(), targetSlot.getStartTime(),
                        targetSlot.getEndTime(), LocalDateTime.now(APP_ZONE))) {
            throw new ConflictException(AppointmentMessages.SLOT_TAKEN);
        }

        String meetingType = resolveAppointmentMeetingType(
                targetSlot.getMeetingType(), request.getMeetingType());
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        AppointmentRescheduleApproval approval = new AppointmentRescheduleApproval();
        approval.setAppointment(appointment);
        approval.setOriginalSlot(appointment.getSlot());
        approval.setProposedSlot(targetSlot);
        approval.setProposedMeetingType(meetingType);
        approval.setRequestStatus(RescheduleRequestStatus.PENDING.name());
        approval.setExpiresAt(now.plusHours(RESCHEDULE_APPROVAL_HOURS));
        approval.setCreatedAt(now);
        approval.setUpdatedAt(now);
        AppointmentRescheduleApproval savedApproval = appointmentRescheduleRequestRepository.save(approval);
        createAppointmentNotification(
                appointment,
                appointment.getStudent(),
                NotificationType.APPOINTMENT_RESCHEDULE_REQUESTED,
                "Yeniden Planlama Talebi",
                buildRescheduleDescription(savedApproval),
                savedApproval.getRescheduleRequestId());
        return toRescheduleResponse(savedApproval);
    }

    @Transactional(readOnly = true)
    public Optional<AppointmentRescheduleResponse> getPendingStudentReschedule(Integer appointmentId) {
        User student = getCurrentStudent();
        return appointmentRescheduleRequestRepository.findStudentRequest(
                        appointmentId, student.getUserId(), RescheduleRequestStatus.PENDING.name())
                .filter(request -> request.getExpiresAt().isAfter(LocalDateTime.now(APP_ZONE)))
                .map(this::toRescheduleResponse);
    }

    @Transactional(noRollbackFor = ConflictException.class)
    public AppointmentRescheduleResponse acceptStudentReschedule(Integer requestId) {
        return decideStudentReschedule(requestId, true);
    }

    @Transactional(noRollbackFor = ConflictException.class)
    public AppointmentRescheduleResponse rejectStudentReschedule(Integer requestId) {
        return decideStudentReschedule(requestId, false);
    }

    private AppointmentRescheduleResponse decideStudentReschedule(Integer requestId, boolean accept) {
        User student = getCurrentStudent();
        AppointmentRescheduleApproval request = appointmentRescheduleRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.RESCHEDULE_REQUEST_NOT_FOUND));
        if (!Objects.equals(request.getAppointment().getStudent().getUserId(), student.getUserId())) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        if (!RescheduleRequestStatus.PENDING.name().equals(request.getRequestStatus())) {
            throw new ConflictException(AppointmentMessages.RESCHEDULE_NOT_ALLOWED);
        }
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        if (!request.getExpiresAt().isAfter(now)) {
            expireReschedule(request, now);
            throw new ConflictException(AppointmentMessages.RESCHEDULE_REQUEST_EXPIRED);
        }

        Appointment appointment = appointmentRepository.findByIdAndStudentIdForUpdate(
                        request.getAppointment().getAppointmentId(), student.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND));
        if (accept) {
            validateReschedulableStatus(appointment.getAppointmentStatus());
            AvailabilitySlot targetSlot = availabilitySlotRepository.findByIdWithStaffForUpdate(
                            request.getProposedSlot().getSlotId())
                    .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.SLOT_NOT_FOUND));
            if (appointmentRepository.existsOverlappingActiveAppointmentForStudentExcludingAppointment(
                    student.getUserId(), targetSlot.getSlotDate(), targetSlot.getStartTime(),
                    targetSlot.getEndTime(), appointment.getAppointmentId(), ACTIVE_APPOINTMENT_STATUSES)) {
                throw new ConflictException(AppointmentMessages.TIME_OVERLAP);
            }
            if (appointmentRepository.existsActiveAppointmentForSlotExcludingAppointment(
                    targetSlot.getSlotId(), appointment.getAppointmentId(), ACTIVE_APPOINTMENT_STATUSES)) {
                throw new ConflictException(AppointmentMessages.SLOT_TAKEN);
            }
            appointment.setSlot(targetSlot);
            appointment.setMeetingType(request.getProposedMeetingType());
            appointment.setUpdatedAt(now);
            appointmentRepository.save(appointment);
            request.setRequestStatus(RescheduleRequestStatus.ACCEPTED.name());
            String description = buildRescheduleDescription(request);
            createAppointmentNotification(appointment, appointment.getStaff(), NotificationType.APPOINTMENT_RESCHEDULED,
                    "Yeniden Planlama Kabul Edildi", description, request.getRescheduleRequestId());
            createAppointmentNotification(appointment, student, NotificationType.APPOINTMENT_RESCHEDULED,
                    "Randevu Yeniden Planlandı", description, request.getRescheduleRequestId());
        } else {
            request.setRequestStatus(RescheduleRequestStatus.REJECTED.name());
            appointment.setAppointmentStatus(AppointmentStatus.CANCELLED.name());
            appointment.setUpdatedAt(now);
            appointmentRepository.save(appointment);
            String description = buildRescheduleDescription(request);
            createAppointmentNotification(appointment, appointment.getStaff(), NotificationType.APPOINTMENT_RESCHEDULE_REJECTED,
                    "Yeniden Planlama Reddedildi ve Randevu İptal Edildi", description,
                    request.getRescheduleRequestId());
            createAppointmentNotification(appointment, student, NotificationType.APPOINTMENT_CANCELLED,
                    "Randevu İptal Edildi", description, request.getRescheduleRequestId());
        }
        request.setUpdatedAt(now);
        return toRescheduleResponse(appointmentRescheduleRequestRepository.save(request));
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expirePendingRescheduleRequests() {
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        appointmentRescheduleRequestRepository.findExpiredPending(now)
                .forEach(request -> expireReschedule(request, now));
    }

    private void expireReschedule(AppointmentRescheduleApproval request, LocalDateTime now) {
        request.setRequestStatus(RescheduleRequestStatus.EXPIRED.name());
        request.setUpdatedAt(now);
        appointmentRescheduleRequestRepository.save(request);
        Appointment appointment = request.getAppointment();
        String description = buildRescheduleDescription(request);
        createAppointmentNotification(appointment, appointment.getStudent(), NotificationType.APPOINTMENT_RESCHEDULE_EXPIRED,
                "Yeniden Planlama Süresi Doldu", description, request.getRescheduleRequestId());
        createAppointmentNotification(appointment, appointment.getStaff(), NotificationType.APPOINTMENT_RESCHEDULE_EXPIRED,
                "Yeniden Planlama Süresi Doldu", description, request.getRescheduleRequestId());
    }

    private AppointmentRescheduleResponse toRescheduleResponse(AppointmentRescheduleApproval request) {
        AvailabilitySlot slot = request.getProposedSlot();
        return AppointmentRescheduleResponse.builder()
                .rescheduleRequestId(request.getRescheduleRequestId())
                .appointmentId(request.getAppointment().getAppointmentId())
                .status(request.getRequestStatus())
                .academicianName(request.getAppointment().getStaff().getFullName())
                .studentName(request.getAppointment().getStudent().getFullName())
                .originalDate(request.getOriginalSlot().getSlotDate())
                .originalStartTime(request.getOriginalSlot().getStartTime())
                .originalEndTime(request.getOriginalSlot().getEndTime())
                .proposedDate(slot.getSlotDate())
                .proposedStartTime(slot.getStartTime())
                .proposedEndTime(slot.getEndTime())
                .proposedMeetingType(request.getProposedMeetingType())
                .categoryName(request.getAppointment().getCategory().getCategoryName())
                .expiresAt(request.getExpiresAt())
                .build();
    }

    private String buildRescheduleDescription(AppointmentRescheduleApproval request) {
        Appointment appointment = request.getAppointment();
        AvailabilitySlot original = request.getOriginalSlot();
        AvailabilitySlot proposed = request.getProposedSlot();
        String meetingType = MeetingType.ONLINE.name().equals(request.getProposedMeetingType())
                ? "Online" : "Yüz Yüze";
        return "%s ile %s arasındaki %s randevusu; eski zaman: %s %s-%s, önerilen zaman: %s %s-%s, görüşme türü: %s."
                .formatted(
                        appointment.getStudent().getFullName(),
                        appointment.getStaff().getFullName(),
                        appointment.getCategory().getCategoryName(),
                        original.getSlotDate().format(NOTIFICATION_DATE),
                        original.getStartTime().format(NOTIFICATION_TIME),
                        original.getEndTime().format(NOTIFICATION_TIME),
                        proposed.getSlotDate().format(NOTIFICATION_DATE),
                        proposed.getStartTime().format(NOTIFICATION_TIME),
                        proposed.getEndTime().format(NOTIFICATION_TIME),
                        meetingType);
    }

    private StaffAppointmentResponseDto updateStaffAppointmentStatus(
            Integer appointmentId,
            AppointmentStatus targetStatus,
            RoleType requiredRole) {
        User staff = getCurrentStaff(requiredRole);
        Appointment appointment = appointmentRepository.findByIdAndStaffIdForUpdate(
                        appointmentId, staff.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND));

        validatePendingStatus(appointment.getAppointmentStatus());
        appointment.setAppointmentStatus(targetStatus.name());
        appointment.setUpdatedAt(LocalDateTime.now(APP_ZONE));

        Appointment saved = appointmentRepository.save(appointment);
        NotificationType notificationType = targetStatus == AppointmentStatus.APPROVED
                ? NotificationType.APPOINTMENT_APPROVED
                : NotificationType.APPOINTMENT_REJECTED;
        createAppointmentNotification(
                saved,
                appointment.getStudent(),
                notificationType,
                targetStatus == AppointmentStatus.APPROVED ? "Randevu Onaylandı" : "Randevu Reddedildi",
                targetStatus == AppointmentStatus.APPROVED
                        ? "Randevu talebiniz onaylandı."
                        : "Randevu talebiniz reddedildi.");
        if (targetStatus == AppointmentStatus.REJECTED) {
            waitlistService.processWaitlistForSlot(saved.getSlot(), LocalDateTime.now(APP_ZONE));
        }
        return appointmentMapper.toStaffResponse(saved);
    }

    private void createAppointmentNotification(
            Appointment appointment,
            User recipient,
            NotificationType type,
            String title,
            String message) {
        createAppointmentNotification(appointment, recipient, type, title, message, null);
    }

    private void createAppointmentNotification(
            Appointment appointment,
            User recipient,
            NotificationType type,
            String title,
            String message,
            Integer rescheduleRequestId) {
        notificationService.createNotification(NotificationCreateRequest.builder()
                .userId(recipient.getUserId())
                .notificationType(type)
                .title(title)
                .message(withAppointmentContext(appointment, message))
                .relatedAppointmentId(appointment.getAppointmentId())
                .relatedRescheduleRequestId(rescheduleRequestId)
                .build());
    }

    private String withAppointmentContext(Appointment appointment, String message) {
        if (message.contains("eski zaman:") || message.contains("randevusunu iptal etti.")) {
            return message;
        }
        AvailabilitySlot slot = appointment.getSlot();
        String meetingType = MeetingType.ONLINE.name().equals(appointment.getMeetingType())
                ? "Online" : MeetingType.FACE_TO_FACE.name().equals(appointment.getMeetingType())
                        ? "Yüz Yüze" : "-";
        return "%s Akademisyen: %s, öğrenci: %s, tarih ve saat: %s %s-%s, görüşme türü: %s, kategori: %s."
                .formatted(
                        message,
                        appointment.getStaff() == null ? "-" : appointment.getStaff().getFullName(),
                        appointment.getStudent() == null ? "-" : appointment.getStudent().getFullName(),
                        slot == null || slot.getSlotDate() == null ? "-" : slot.getSlotDate().format(NOTIFICATION_DATE),
                        slot == null || slot.getStartTime() == null ? "-" : slot.getStartTime().format(NOTIFICATION_TIME),
                        slot == null || slot.getEndTime() == null ? "-" : slot.getEndTime().format(NOTIFICATION_TIME),
                        meetingType,
                        appointment.getCategory() == null ? "-" : appointment.getCategory().getCategoryName());
    }

    private String buildStudentCancellationMessage(Appointment appointment) {
        AvailabilitySlot slot = appointment.getSlot();
        return "%s, %s %s tarihli '%s' randevusunu iptal etti."
                .formatted(
                        appointment.getStudent().getFullName(),
                        slot.getSlotDate().format(NOTIFICATION_DATE),
                        slot.getStartTime().format(NOTIFICATION_TIME),
                        appointment.getCategory().getCategoryName());
    }

    private void validatePendingStatus(String currentStatus) {
        if (AppointmentStatus.PENDING.name().equals(currentStatus)) {
            return;
        }
        if (AppointmentStatus.APPROVED.name().equals(currentStatus)) {
            throw new ConflictException(AppointmentMessages.ALREADY_APPROVED);
        }
        if (AppointmentStatus.REJECTED.name().equals(currentStatus)) {
            throw new ConflictException(AppointmentMessages.ALREADY_REJECTED);
        }
        throw new ConflictException(AppointmentMessages.NOT_PENDING);
    }

    private void validateReschedulableStatus(String currentStatus) {
        if (AppointmentStatus.COMPLETED.name().equals(currentStatus)
                || AppointmentStatus.CANCELLED.name().equals(currentStatus)
                || AppointmentStatus.NO_SHOW.name().equals(currentStatus)) {
            throw new ConflictException(AppointmentMessages.RESCHEDULE_NOT_ALLOWED);
        }
    }

    private void validateEndableStatus(String currentStatus) {
        if (AppointmentStatus.APPROVED.name().equals(currentStatus)) {
            return;
        }
        throw new ConflictException(AppointmentMessages.END_NOT_APPROVED);
    }

    private AvailabilitySlot resolveRequestedAvailability(
            AvailabilitySlot templateSlot,
            User staff,
            LocalDate bookingDate,
            LocalTime bookingStart,
            LocalTime bookingEnd) {
        if (templateSlot.getRecurrenceRule() == null
                && bookingDate.equals(templateSlot.getSlotDate())
                && bookingStart.equals(templateSlot.getStartTime())
                && bookingEnd.equals(templateSlot.getEndTime())) {
            return templateSlot;
        }

        return availabilitySlotRepository.findDuplicateSlot(
                        staff.getUserId(), bookingDate, bookingStart, bookingEnd)
                .orElseGet(() -> {
                    AvailabilitySlot newSlot = new AvailabilitySlot();
                    newSlot.setStaff(staff);
                    newSlot.setSlotDate(bookingDate);
                    newSlot.setStartTime(bookingStart);
                    newSlot.setEndTime(bookingEnd);
                    newSlot.setIsBlocked(templateSlot.getIsBlocked());
                    newSlot.setMeetingType(templateSlot.getMeetingType());
                    newSlot.setRecurrenceRule(null);
                    return availabilitySlotRepository.save(newSlot);
                });
    }

    private void validateStudentCancellable(Appointment appointment) {
        String status = appointment.getAppointmentStatus();
        if (AppointmentStatus.CANCELLED.name().equals(status)) {
            throw new ConflictException(AppointmentMessages.CANCEL_ALREADY_CANCELLED);
        }
        if (!ACTIVE_APPOINTMENT_STATUSES.contains(status)) {
            throw new ConflictException(AppointmentMessages.CANCEL_NOT_ACTIVE);
        }
        if (isAppointmentInPast(appointment)) {
            throw new BadRequestException(AppointmentMessages.CANCEL_PAST);
        }
    }

    private RuntimeException ownershipException(Integer appointmentId, String accessDeniedMessage) {
        if (appointmentRepository.existsByAppointmentId(appointmentId)) {
            return new AccessDeniedException(accessDeniedMessage);
        }
        return new ResourceNotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND);
    }

    private void ensureStaffIsBookable(User staff) {
        if (staff == null) {
            throw new BadRequestException(AppointmentMessages.STAFF_NOT_BOOKABLE);
        }
        String roleName = staff.getRole() != null ? staff.getRole().getRoleName() : null;
        if (roleName == null || !BOOKABLE_STAFF_ROLES.contains(roleName)) {
            throw new BadRequestException(AppointmentMessages.STAFF_NOT_BOOKABLE);
        }
        if (!Boolean.TRUE.equals(staff.getIsActive())) {
            throw new ConflictException(AppointmentMessages.STAFF_INACTIVE);
        }
        if (!Boolean.TRUE.equals(staff.getIsAcceptingAppointments())) {
            throw new ConflictException(AppointmentMessages.STAFF_NOT_ACCEPTING);
        }
    }

    private void ensureSlotBookable(AvailabilitySlot slot, Integer staffId) {
        if (Boolean.TRUE.equals(slot.getIsBlocked())) {
            throw new ConflictException(AppointmentMessages.SLOT_BLOCKED);
        }
        if (isSlotInPast(slot)) {
            throw new BadRequestException(AppointmentMessages.SLOT_PAST);
        }

        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDate today = now.toLocalDate();
        LocalDateTime earliestBookable = now.plusMinutes(AppointmentConstraints.MINIMUM_BOOKING_NOTICE_MINUTES);
        LocalDate latestBookableDate = today.plusDays(AppointmentConstraints.MAXIMUM_BOOKING_HORIZON_DAYS);
        LocalDateTime slotStart = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());

        // BR-017
        if (slotStart.isBefore(earliestBookable)) {
            throw new BadRequestException(AppointmentMessages.SLOT_TOO_SOON);
        }
        // BR-018
        if (slot.getSlotDate().isAfter(latestBookableDate)) {
            throw new BadRequestException(AppointmentMessages.SLOT_TOO_FAR);
        }
        if (outOfOfficePeriodRepository.existsOverlappingPeriod(
                staffId, slot.getSlotDate(), slot.getSlotDate())) {
            throw new ConflictException(AppointmentMessages.SLOT_OUT_OF_OFFICE);
        }
    }

    private Course resolveCourse(Integer courseId, AppointmentCategory category, User staff) {
        boolean requiresCourse = Boolean.TRUE.equals(category.getRequiresCourseSelection());
        if (requiresCourse) {
            if (courseId == null) {
                throw new BadRequestException(AppointmentMessages.COURSE_REQUIRED);
            }
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException(AppointmentMessages.COURSE_NOT_FOUND));
            if (RoleType.ASSISTANT.name().equals(staff.getRole().getRoleName())) {
                if (!courseAssignmentRepository.existsByCourse_CourseIdAndAssistant_UserId(courseId, staff.getUserId())) {
                    throw new BadRequestException(AppointmentMessages.COURSE_STAFF_MISMATCH);
                }
            } else {
                if (course.getOwnerAcademician() == null
                        || !Objects.equals(course.getOwnerAcademician().getUserId(), staff.getUserId())) {
                    throw new BadRequestException(AppointmentMessages.COURSE_STAFF_MISMATCH);
                }
            }
            if (!Boolean.TRUE.equals(course.getIsActive())) {
                throw new BadRequestException(AppointmentMessages.COURSE_INACTIVE);
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

    private void ensureStudentNotRestricted(User student) {
        noShowPenaltyService.resolveActiveRestriction(student, LocalDate.now(APP_ZONE))
                .ifPresent(restriction -> {
                    throw new StudentAppointmentRestrictedException(restriction);
                });
    }

    private boolean isSlotInPast(AvailabilitySlot slot) {
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDate today = now.toLocalDate();
        if (slot.getSlotDate().isBefore(today)) {
            return true;
        }
        return slot.getSlotDate().isEqual(today) && slot.getEndTime().isBefore(now.toLocalTime());
    }

    private boolean isAppointmentInPast(Appointment appointment) {
        return isSlotInPast(appointment.getSlot());
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

    private User getCurrentStaff(RoleType requiredRole) {
        if (requiredRole != RoleType.ASSISTANT && requiredRole != RoleType.ACADEMICIAN) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        User user = userDetails.getUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!requiredRole.name().equals(roleName)) {
            boolean isAcademicianRequestByHod = requiredRole == RoleType.ACADEMICIAN && RoleType.HOD.name().equals(roleName);
            if (!isAcademicianRequestByHod) {
                String message = requiredRole == RoleType.ASSISTANT
                        ? AppointmentMessages.ONLY_ASSISTANT
                        : AppointmentMessages.ONLY_ACADEMICIAN;
                throw new AccessDeniedException(message);
            }
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

    private Comparator<Appointment> staffAppointmentComparator() {
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
}
