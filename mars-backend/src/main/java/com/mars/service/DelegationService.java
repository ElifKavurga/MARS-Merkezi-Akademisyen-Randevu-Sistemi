package com.mars.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.Set;


import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.DelegationMessages;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.CreateDelegationRequest;
import com.mars.dto.DelegationResponse;
import com.mars.dto.DelegationStatusHistoryResponse;
import com.mars.dto.DelegationTargetResponse;
import com.mars.dto.NotificationCreateRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.DelegationLog;
import com.mars.entity.DelegationStatusHistory;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.DelegationStatus;
import com.mars.enums.NotificationType;
import com.mars.enums.RoleType;
import com.mars.enums.SlotLockStatus;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.DelegationMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AppointmentRescheduleRequestRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.repository.DelegationStatusHistoryRepository;
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DelegationService {
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final long STUDENT_APPROVAL_MINUTES = 120;
    private static final DateTimeFormatter NOTIFICATION_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter NOTIFICATION_TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(), AppointmentStatus.APPROVED.name());
    private static final Set<String> TARGET_ROLES = Set.of(
            RoleType.ACADEMICIAN.name(), RoleType.ASSISTANT.name());

    private final DelegationLogRepository delegationLogRepository;
    private final DelegationStatusHistoryRepository delegationStatusHistoryRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentRescheduleRequestRepository appointmentRescheduleRequestRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final CourseAssignmentRepository courseAssignmentRepository;
    private final UserRepository userRepository;
    private final DelegationMapper delegationMapper;
    private final AvailabilitySlotService availabilitySlotService;
    private final NotificationService notificationService;
    private final WaitlistService waitlistService;

    @Transactional(readOnly = true)
    public List<DelegationTargetResponse> getDelegationTargets(Integer appointmentId) {
        User delegatingStaff = getCurrentDelegatingStaff();
        Appointment appointment = getOwnedAppointment(appointmentId, delegatingStaff);
        validateAppointmentStatus(appointment.getAppointmentStatus());

        return findDelegationTargetUsers(delegatingStaff)
                .stream()
                .filter(user -> !Objects.equals(user.getUserId(), delegatingStaff.getUserId()))
                .map(user -> toTargetResponse(appointment, user))
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional
    public DelegationResponse createDelegation(CreateDelegationRequest request) {
        User delegatingStaff = getCurrentDelegatingStaff();
        if (request.getAppointmentId() == null) {
            throw new BadRequestException(DelegationMessages.APPOINTMENT_REQUIRED);
        }
        Integer targetUserId = request.resolveTargetUserId();
        if (targetUserId == null) {
            throw new BadRequestException(DelegationMessages.TARGET_REQUIRED);
        }

        Appointment appointment = getOwnedAppointmentForUpdate(request.getAppointmentId(), delegatingStaff);
        validateAppointmentStatus(appointment.getAppointmentStatus());

        User target = userRepository.findByIdWithRoleAndDepartment(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.TARGET_NOT_FOUND));
        validateTarget(target, delegatingStaff);

        boolean relatedCourseAssistant = isRelatedCourseAssistant(appointment, target);
        boolean approvalRequired = !relatedCourseAssistant;
        validateNoPendingDelegation(appointment.getAppointmentId());

        AvailableSlotResponseDto selectedSlot = findSelectedAvailableSlot(appointment, target, request);
        AvailabilitySlot targetTemplate = availabilitySlotRepository
                .findByIdWithStaffForUpdate(selectedSlot.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.TARGET_SLOT_NOT_FOUND));
        if (!Objects.equals(targetTemplate.getStaff().getUserId(), target.getUserId())) {
            throw new ConflictException(DelegationMessages.TARGET_SLOT_UNAVAILABLE);
        }

        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        if (appointmentRepository.existsOverlappingActiveAppointmentForStaff(
                target.getUserId(),
                selectedSlot.getSlotDate(),
                selectedSlot.getStartTime(),
                selectedSlot.getEndTime(),
                ACTIVE_APPOINTMENT_STATUSES)
                || delegationLogRepository.existsActiveSlotLock(
                        target.getUserId(),
                        selectedSlot.getSlotDate(),
                        selectedSlot.getStartTime(),
                        selectedSlot.getEndTime(),
                        now,
                        null)
                || appointmentRescheduleRequestRepository.existsActiveSlotLock(
                        target.getUserId(), selectedSlot.getSlotDate(), selectedSlot.getStartTime(),
                        selectedSlot.getEndTime(), now)) {
            throw new ConflictException(DelegationMessages.TARGET_SLOT_UNAVAILABLE);
        }

        DelegationLog log = delegationMapper.toEntity(appointment, delegatingStaff, target, now);
        log.setTargetSlot(targetTemplate);
        log.setTargetSlotDate(selectedSlot.getSlotDate());
        log.setTargetStartTime(selectedSlot.getStartTime());
        log.setTargetEndTime(selectedSlot.getEndTime());
        log.setApprovalRequired(approvalRequired);
        boolean academicianTarget =
                RoleType.ACADEMICIAN.name().equals(target.getRole().getRoleName())
                || RoleType.HOD.name().equals(target.getRole().getRoleName());
        log.setDelegationStatus(academicianTarget
                ? DelegationStatus.PENDING_ACADEMICIAN_APPROVAL.name()
                : DelegationStatus.PENDING.name());
        log.setStudentApprovalExpiresAt(null);
        log.setSlotLockStatus(SlotLockStatus.LOCKED.name());

        DelegationLog saved = delegationLogRepository.save(log);
        recordStatus(saved, DelegationStatus.valueOf(saved.getDelegationStatus()), saved.getDelegatedAt());
        String requestDescription = appendOptionalDescription(
                "Yeni bir randevu devri talebiniz bulunuyor.",
                request.getDescription());
        createDelegationNotification(
                saved,
                saved.getDelegatedToUser(),
                NotificationType.DELEGATION_REQUEST,
                "Randevu Devri Talebi",
                requestDescription);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getIncomingDelegations() {
        User target = getCurrentDecisionUser();
        Set<String> statuses = (RoleType.ACADEMICIAN.name().equals(target.getRole().getRoleName()) || RoleType.HOD.name().equals(target.getRole().getRoleName()))
                ? Set.of(
                        DelegationStatus.PENDING_ACADEMICIAN_APPROVAL.name(),
                        DelegationStatus.PENDING_STUDENT_APPROVAL.name())
                : Set.of(DelegationStatus.PENDING.name());
        return delegationLogRepository.findIncomingByTargetIdAndStatuses(
                        target.getUserId(), statuses)
                .stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getDelegationHistory() {
        User currentUser = getCurrentHistoryUser();
        String roleName = currentUser.getRole().getRoleName();
        List<DelegationLog> history = (RoleType.ACADEMICIAN.name().equals(roleName) || RoleType.HOD.name().equals(roleName))
                ? delegationLogRepository.findHistoryByDelegatedByUserId(currentUser.getUserId())
                : delegationLogRepository.findHistoryByDelegatedToUserId(currentUser.getUserId());
        return history.stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getSentDelegations() {
        User currentUser = getCurrentHistoryUser();
        return delegationLogRepository.findHistoryByDelegatedByUserId(currentUser.getUserId())
                .stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getReceivedDelegations() {
        User currentUser = getCurrentHistoryUser();
        return delegationLogRepository.findHistoryByDelegatedToUserId(currentUser.getUserId())
                .stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getStudentDelegations() {
        User student = getCurrentStudent();
        return delegationLogRepository.findHistoryByStudentId(student.getUserId())
                .stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DelegationResponse getDelegation(Integer delegationId) {
        requireValidDelegationId(delegationId);
        User currentUser = getAuthenticatedUser();
        DelegationLog log = delegationLogRepository.findByIdWithDetails(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.DELEGATION_NOT_FOUND));
        boolean participantStaff =
                Objects.equals(log.getDelegatedByUser().getUserId(), currentUser.getUserId())
                || Objects.equals(log.getDelegatedToUser().getUserId(), currentUser.getUserId());
        boolean appointmentStudent = log.getAppointment().getStudent() != null
                && Objects.equals(
                        log.getAppointment().getStudent().getUserId(),
                        currentUser.getUserId());
        if (!participantStaff && !appointmentStudent) {
            throw new AccessDeniedException(DelegationMessages.ACCESS_DENIED);
        }
        DelegationResponse response = delegationMapper.toResponse(log);
        response.setStatusHistory(delegationStatusHistoryRepository
                .findByDelegation_DelegationIdOrderByChangedAtAsc(delegationId)
                .stream()
                .map(item -> DelegationStatusHistoryResponse.builder()
                        .status(item.getStatus())
                        .changedAt(item.getChangedAt())
                        .build())
                .toList());
        return response;
    }

    @Transactional
    public DelegationResponse acceptDelegation(Integer delegationId) {
        User target = getCurrentDecisionUser();
        DelegationLog log = getOwnedPendingDelegationForDecision(delegationId, target);
        if (Boolean.TRUE.equals(log.getApprovalRequired())) {
            transitionStatus(log, DelegationStatus.PENDING_STUDENT_APPROVAL);
            log.setStudentApprovalExpiresAt(LocalDateTime.now(APP_ZONE).plusMinutes(STUDENT_APPROVAL_MINUTES));
            delegationLogRepository.save(log);
            notificationService.createPreparedEmailNotification(
                    log.getAppointment().getStudent(),
                    "DELEGATION_STUDENT_APPROVAL",
                    "Randevu devri onayı",
                    withDelegationContext(log, "Hedef personel randevu devrini kabul etti. Onayınız bekleniyor."),
                    log);
            return toResponse(log);
        }
        completeTransfer(log, target);
        transitionStatus(log, DelegationStatus.ACCEPTED);
        log.setSlotLockStatus(SlotLockStatus.CONSUMED.name());
        delegationLogRepository.save(log);
        createDelegationNotification(
                log,
                log.getDelegatedByUser(),
                NotificationType.DELEGATION_ACCEPTED,
                "Randevu Devri Kabul Edildi",
                "Randevu devri talebiniz kabul edildi.");
        createDelegationNotification(
                log,
                log.getAppointment().getStudent(),
                NotificationType.DELEGATION_ACCEPTED,
                "Randevu Devri Bilgilendirmesi",
                "Randevunuz ilgili dersin yetkili asistanına devredildi.");
        return toResponse(log);
    }

    @Transactional
    public DelegationResponse rejectDelegation(Integer delegationId) {
        User target = getCurrentDecisionUser();
        DelegationLog log = getOwnedPendingDelegationForDecision(delegationId, target);
        validateAppointmentProcessable(log.getAppointment().getAppointmentStatus());
        transitionStatus(log, DelegationStatus.REJECTED);
        log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
        delegationLogRepository.save(log);
        createDelegationNotification(
                log,
                log.getDelegatedByUser(),
                NotificationType.DELEGATION_REJECTED,
                "Randevu Devri Reddedildi",
                "Randevu devri talebiniz reddedildi.");
        return toResponse(log);
    }

    private void createDelegationNotification(
            DelegationLog delegation,
            User recipient,
            NotificationType type,
            String title,
            String message) {
        notificationService.createNotification(NotificationCreateRequest.builder()
                .userId(recipient.getUserId())
                .notificationType(type)
                .title(title)
                .message(withDelegationContext(delegation, message))
                .relatedAppointmentId(delegation.getAppointment().getAppointmentId())
                .relatedDelegationId(delegation.getDelegationId())
                .build());
    }

    @Transactional
    public List<DelegationResponse> getPendingStudentApprovals() {
        User student = getCurrentStudent();
        expireStudentApprovals(LocalDateTime.now(APP_ZONE));
        return delegationLogRepository.findStudentApprovals(
                        student.getUserId(), DelegationStatus.PENDING_STUDENT_APPROVAL.name())
                .stream().map(delegationMapper::toResponse).toList();
    }


    @Transactional(noRollbackFor = ConflictException.class)
    public DelegationResponse acceptStudentApproval(Integer delegationId) {
        User student = getCurrentStudent();
        DelegationLog log = getStudentApprovalForDecision(delegationId, student);
        completeTransfer(log, log.getDelegatedToUser());
        transitionStatus(log, DelegationStatus.ACCEPTED);
        log.setSlotLockStatus(SlotLockStatus.CONSUMED.name());
        delegationLogRepository.save(log);
        notificationService.createPreparedEmailNotification(
                log.getDelegatedByUser(),
                "DELEGATION_STUDENT_ACCEPTED",
                "Randevu devri kabul edildi",
                withDelegationContext(log, "Öğrenci randevu yönlendirmesini kabul etti."),
                log);
        createDelegationNotification(
                log,
                log.getDelegatedToUser(),
                NotificationType.DELEGATION_ACCEPTED,
                "Randevu Devri Kabul Edildi",
                "Öğrenci randevu devrini kabul etti.");
        return toResponse(log);
    }

    @Transactional(noRollbackFor = ConflictException.class)
    public DelegationResponse rejectStudentApproval(Integer delegationId) {
        User student = getCurrentStudent();
        DelegationLog log = getStudentApprovalForDecision(delegationId, student);
        transitionStatus(log, DelegationStatus.REJECTED);
        log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
        delegationLogRepository.save(log);
        notificationService.createPreparedEmailNotification(
                log.getDelegatedByUser(),
                "DELEGATION_STUDENT_REJECTED",
                "Randevu devri reddedildi",
                withDelegationContext(log, "Öğrenci randevu yönlendirmesini reddetti."),
                log);
        createDelegationNotification(
                log,
                log.getDelegatedToUser(),
                NotificationType.DELEGATION_REJECTED,
                "Randevu Devri Reddedildi",
                "Öğrenci randevu devrini reddetti.");
        return toResponse(log);
    }

    @Transactional
    public int expireStudentApprovals(LocalDateTime now) {
        List<DelegationLog> expired = delegationLogRepository.findExpiredStudentApprovals(
                DelegationStatus.PENDING_STUDENT_APPROVAL.name(), now);
        for (DelegationLog log : expired) {
            transitionStatus(log, DelegationStatus.EXPIRED, now);
            log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
            notificationService.createPreparedEmailNotification(
                    log.getDelegatedByUser(),
                    "DELEGATION_EXPIRED",
                    "Randevu devri süresi doldu",
                    withDelegationContext(log, "Öğrenci iki saat içinde yanıt vermediği için randevu devri sonlandırıldı."),
                    log);
        }
        delegationLogRepository.saveAll(expired);
        return expired.size();
    }

    @Transactional
    public int synchronizeAcceptedDelegations(LocalDateTime now) {
        List<DelegationLog> terminal = delegationLogRepository.findAcceptedWithTerminalAppointmentStatus(
                DelegationStatus.ACCEPTED.name(),
                Set.of(AppointmentStatus.CANCELLED.name(), AppointmentStatus.COMPLETED.name()));
        for (DelegationLog log : terminal) {
            DelegationStatus target = AppointmentStatus.CANCELLED.name()
                    .equals(log.getAppointment().getAppointmentStatus())
                    ? DelegationStatus.CANCELLED
                    : DelegationStatus.COMPLETED;
            transitionStatus(log, target, now);
        }
        delegationLogRepository.saveAll(terminal);
        return terminal.size();
    }

    private String withDelegationContext(DelegationLog delegation, String message) {
        Appointment appointment = delegation.getAppointment();
        AvailabilitySlot fallbackSlot = delegation.getTargetSlot() != null
                ? delegation.getTargetSlot() : appointment.getSlot();
        var date = delegation.getTargetSlotDate() != null
                ? delegation.getTargetSlotDate() : fallbackSlot == null ? null : fallbackSlot.getSlotDate();
        var start = delegation.getTargetStartTime() != null
                ? delegation.getTargetStartTime() : fallbackSlot == null ? null : fallbackSlot.getStartTime();
        var end = delegation.getTargetEndTime() != null
                ? delegation.getTargetEndTime() : fallbackSlot == null ? null : fallbackSlot.getEndTime();
        String meetingType = "ONLINE".equals(appointment.getMeetingType())
                ? "Online" : "FACE_TO_FACE".equals(appointment.getMeetingType()) ? "Yüz Yüze" : "-";
        return "%s Gönderen: %s, hedef personel: %s, öğrenci: %s, tarih ve saat: %s %s-%s, görüşme türü: %s, kategori: %s."
                .formatted(
                        message,
                        delegation.getDelegatedByUser().getFullName(),
                        delegation.getDelegatedToUser().getFullName(),
                        appointment.getStudent() == null ? "-" : appointment.getStudent().getFullName(),
                        date == null ? "-" : date.format(NOTIFICATION_DATE),
                        start == null ? "-" : start.format(NOTIFICATION_TIME),
                        end == null ? "-" : end.format(NOTIFICATION_TIME),
                        meetingType,
                        appointment.getCategory() == null ? "-" : appointment.getCategory().getCategoryName());
    }

    private String appendOptionalDescription(String message, String description) {
        if (description == null || description.isBlank()) {
            return message;
        }
        return message + " Açıklama: " + description.trim();
    }

    private DelegationTargetResponse toTargetResponse(Appointment appointment, User target) {
        AvailableSlotResponseDto slot = findMatchingSlot(appointment, target);
        if (slot == null) {
            return null;
        }
        boolean related = isRelatedCourseAssistant(appointment, target);
        return DelegationTargetResponse.builder()
                .userId(target.getUserId())
                .fullName(target.getFullName())
                .institutionalEmail(target.getInstitutionalEmail())
                .role(target.getRole().getRoleName())
                .departmentName(target.getDepartment() == null ? null : target.getDepartment().getDepartmentName())
                .relatedCourseAssistant(related)
                .requiresStudentApproval(!related)
                .targetSlotId(slot.getSlotId())
                .targetSlotDate(slot.getSlotDate())
                .targetStartTime(slot.getStartTime())
                .targetEndTime(slot.getEndTime())
                .build();
    }

    private AvailableSlotResponseDto findMatchingSlot(Appointment appointment, User target) {
        return availabilitySlotService.getBookableAvailableSlotsForStaff(
                        target.getUserId(), appointment.getCategory().getDurationMinutes())
                .stream()
                .filter(slot -> Objects.equals(slot.getSlotDate(), appointment.getSlot().getSlotDate()))
                .filter(slot -> Objects.equals(slot.getStartTime(), appointment.getSlot().getStartTime()))
                .filter(slot -> Objects.equals(slot.getEndTime(), appointment.getSlot().getEndTime()))
                .findFirst()
                .orElse(null);
    }

    private AvailableSlotResponseDto findSelectedAvailableSlot(
            Appointment appointment,
            User target,
            CreateDelegationRequest request) {
        AvailableSlotResponseDto matching = findMatchingSlot(appointment, target);
        if (matching == null
                || !Objects.equals(matching.getSlotId(), request.getTargetSlotId())
                || !Objects.equals(matching.getSlotDate(), request.getTargetSlotDate())
                || !Objects.equals(matching.getStartTime(), request.getTargetStartTime())
                || !Objects.equals(matching.getEndTime(), request.getTargetEndTime())) {
            throw new ConflictException(DelegationMessages.TARGET_SLOT_UNAVAILABLE);
        }
        return matching;
    }

    private void completeTransfer(DelegationLog log, User target) {
        Appointment appointment = appointmentRepository.findByIdForUpdate(
                        log.getAppointment().getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.APPOINTMENT_NOT_FOUND));
        if (appointment.getStaff() == null
                || !Objects.equals(
                        appointment.getStaff().getUserId(),
                        log.getDelegatedByUser().getUserId())) {
            throw new ConflictException(DelegationMessages.APPOINTMENT_NOT_PROCESSABLE);
        }
        validateAppointmentProcessable(appointment.getAppointmentStatus());
        log.setAppointment(appointment);
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        if (log.getStudentApprovalExpiresAt() != null
                && !now.isBefore(log.getStudentApprovalExpiresAt())) {
            transitionStatus(log, DelegationStatus.EXPIRED, now);
            log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
            delegationLogRepository.save(log);
            throw new ConflictException(DelegationMessages.STUDENT_APPROVAL_EXPIRED);
        }

        // V7/V8 ile oluşturulmuş bekleyen delegasyonlarda hedef slot bilgisi yoktur.
        // Bu kayıtlar mevcut davranışla tamamlanmaya devam eder.
        if (log.getTargetSlot() == null) {
            appointment.setStaff(target);
            appointment.setUpdatedAt(now);
            appointmentRepository.save(appointment);
            rejectOtherPendingDelegations(appointment.getAppointmentId(), log.getDelegationId(), now);
            return;
        }

        AvailabilitySlot template = availabilitySlotRepository
                .findByIdWithStaffForUpdate(log.getTargetSlot().getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.TARGET_SLOT_NOT_FOUND));
        if (!Objects.equals(template.getStaff().getUserId(), target.getUserId())) {
            throw new ConflictException(DelegationMessages.TARGET_SLOT_UNAVAILABLE);
        }
        if (appointmentRepository.existsOverlappingActiveAppointmentForStaffExcludingAppointment(
                target.getUserId(),
                log.getTargetSlotDate(),
                log.getTargetStartTime(),
                log.getTargetEndTime(),
                appointment.getAppointmentId(),
                ACTIVE_APPOINTMENT_STATUSES)
                || delegationLogRepository.existsActiveSlotLock(
                        target.getUserId(),
                        log.getTargetSlotDate(),
                        log.getTargetStartTime(),
                        log.getTargetEndTime(),
                        now,
                        log.getDelegationId())) {
            throw new ConflictException(DelegationMessages.TARGET_SLOT_UNAVAILABLE);
        }

        AvailabilitySlot concreteSlot = resolveTargetSlot(template, target, log);
        appointment.setStaff(target);
        appointment.setSlot(concreteSlot);
        appointment.setUpdatedAt(now);
        appointmentRepository.save(appointment);
        rejectOtherPendingDelegations(appointment.getAppointmentId(), log.getDelegationId(), now);
    }

    private AvailabilitySlot resolveTargetSlot(AvailabilitySlot template, User target, DelegationLog log) {
        if (template.getRecurrenceRule() == null
                && Objects.equals(template.getSlotDate(), log.getTargetSlotDate())
                && Objects.equals(template.getStartTime(), log.getTargetStartTime())
                && Objects.equals(template.getEndTime(), log.getTargetEndTime())) {
            return template;
        }
        return availabilitySlotRepository.findDuplicateSlot(
                        target.getUserId(),
                        log.getTargetSlotDate(),
                        log.getTargetStartTime(),
                        log.getTargetEndTime())
                .orElseGet(() -> {
                    AvailabilitySlot slot = new AvailabilitySlot();
                    slot.setStaff(target);
                    slot.setSlotDate(log.getTargetSlotDate());
                    slot.setStartTime(log.getTargetStartTime());
                    slot.setEndTime(log.getTargetEndTime());
                    slot.setIsBlocked(template.getIsBlocked());
                    slot.setMeetingType(template.getMeetingType());
                    slot.setRecurrenceRule(null);
                    return availabilitySlotRepository.save(slot);
                });
    }

    private DelegationLog getStudentApprovalForDecision(Integer delegationId, User student) {
        requireValidDelegationId(delegationId);
        DelegationLog log = delegationLogRepository.findByIdForUpdate(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.DELEGATION_NOT_FOUND));
        if (!Objects.equals(log.getAppointment().getStudent().getUserId(), student.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.STUDENT_DECISION_ACCESS_DENIED);
        }
        if (!DelegationStatus.PENDING_STUDENT_APPROVAL.name().equals(log.getDelegationStatus())) {
            throw new ConflictException(DelegationMessages.NOT_PENDING_STUDENT_APPROVAL);
        }
        if (!LocalDateTime.now(APP_ZONE).isBefore(log.getStudentApprovalExpiresAt())) {
            transitionStatus(log, DelegationStatus.EXPIRED);
            log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
            delegationLogRepository.save(log);
            throw new ConflictException(DelegationMessages.STUDENT_APPROVAL_EXPIRED);
        }
        return log;
    }

    private DelegationLog getOwnedPendingDelegationForDecision(Integer delegationId, User target) {
        requireValidDelegationId(delegationId);
        DelegationLog log = delegationLogRepository.findByIdForUpdate(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.DELEGATION_NOT_FOUND));
        if (!Objects.equals(log.getDelegatedToUser().getUserId(), target.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.DECISION_ACCESS_DENIED);
        }
        DelegationStatus expected = (RoleType.ACADEMICIAN.name().equals(target.getRole().getRoleName()) || RoleType.HOD.name().equals(target.getRole().getRoleName()))
                ? DelegationStatus.PENDING_ACADEMICIAN_APPROVAL
                : DelegationStatus.PENDING;
        if (!expected.name().equals(log.getDelegationStatus())) {
            throw new ConflictException(DelegationMessages.NOT_PENDING);
        }
        return log;
    }

    private Appointment getOwnedAppointment(Integer appointmentId, User academician) {
        Appointment appointment = appointmentRepository.findByIdWithStaffAndCourse(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.APPOINTMENT_NOT_FOUND));
        if (appointment.getStaff() == null
                || !Objects.equals(appointment.getStaff().getUserId(), academician.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.OWNERSHIP_DENIED);
        }
        return appointment;
    }

    private Appointment getOwnedAppointmentForUpdate(Integer appointmentId, User academician) {
        Appointment appointment = appointmentRepository.findByIdForUpdate(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.APPOINTMENT_NOT_FOUND));
        if (appointment.getStaff() == null
                || !Objects.equals(appointment.getStaff().getUserId(), academician.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.OWNERSHIP_DENIED);
        }
        return appointment;
    }

    private void validateTarget(User target, User academician) {
        if (!Boolean.TRUE.equals(target.getIsActive()) || target.getRole() == null
                || !TARGET_ROLES.contains(target.getRole().getRoleName())
                || Objects.equals(target.getUserId(), academician.getUserId())) {
            throw new BadRequestException(DelegationMessages.INVALID_TARGET);
        }
        if (RoleType.ASSISTANT.name().equals(academician.getRole().getRoleName())) {
            boolean assistantTarget = RoleType.ASSISTANT.name().equals(target.getRole().getRoleName());
            boolean sameDepartment = academician.getDepartment() != null
                    && target.getDepartment() != null
                    && Objects.equals(
                            academician.getDepartment().getDepartmentId(),
                            target.getDepartment().getDepartmentId());
            if (!assistantTarget || !sameDepartment) {
                throw new BadRequestException(DelegationMessages.INVALID_TARGET);
            }
        }
    }

    private List<User> findDelegationTargetUsers(User delegatingStaff) {
        if (RoleType.ASSISTANT.name().equals(delegatingStaff.getRole().getRoleName())) {
            Integer departmentId = delegatingStaff.getDepartment() == null
                    ? null
                    : delegatingStaff.getDepartment().getDepartmentId();
            if (departmentId == null) {
                return List.of();
            }
            return userRepository.findActiveUsersByDepartmentIdAndRoleNames(
                    departmentId,
                    Set.of(RoleType.ASSISTANT.name()));
        }
        return userRepository.findActiveUsersByRoleNamesExcludingUser(
                TARGET_ROLES,
                delegatingStaff.getUserId());
    }

    private boolean isRelatedCourseAssistant(Appointment appointment, User target) {
        return RoleType.ASSISTANT.name().equals(target.getRole().getRoleName())
                && appointment.getCourse() != null
                && appointment.getCourse().getCourseId() != null
                && courseAssignmentRepository.existsByCourse_CourseIdAndAssistant_UserId(
                        appointment.getCourse().getCourseId(), target.getUserId());
    }

    private void validateNoPendingDelegation(Integer appointmentId) {
        if (delegationLogRepository.existsByAppointment_AppointmentIdAndDelegationStatus(
                appointmentId, DelegationStatus.PENDING.name())
                || delegationLogRepository.existsByAppointment_AppointmentIdAndDelegationStatus(
                        appointmentId, DelegationStatus.PENDING_STUDENT_APPROVAL.name())
                || delegationLogRepository.existsByAppointment_AppointmentIdAndDelegationStatus(
                        appointmentId, DelegationStatus.PENDING_ACADEMICIAN_APPROVAL.name())) {
            throw new ConflictException(DelegationMessages.PENDING_EXISTS);
        }
    }

    private void rejectOtherPendingDelegations(Integer appointmentId, Integer acceptedId, LocalDateTime now) {
        List<DelegationLog> others = delegationLogRepository
                .findByAppointment_AppointmentIdAndDelegationStatusAndDelegationIdNot(
                        appointmentId, DelegationStatus.PENDING.name(), acceptedId);
        for (DelegationLog other : others) {
            transitionStatus(other, DelegationStatus.REJECTED, now);
        }
        delegationLogRepository.saveAll(others);
    }

    private DelegationResponse toResponse(DelegationLog log) {
        return delegationMapper.toResponse(
                delegationLogRepository.findByIdWithDetails(log.getDelegationId()).orElse(log));
    }

    private void validateAppointmentProcessable(String status) {
        if (!ACTIVE_APPOINTMENT_STATUSES.contains(status)) {
            throw new ConflictException(DelegationMessages.APPOINTMENT_NOT_PROCESSABLE);
        }
    }

    private void validateAppointmentStatus(String status) {
        if (!ACTIVE_APPOINTMENT_STATUSES.contains(status)) {
            throw new BadRequestException(DelegationMessages.APPOINTMENT_NOT_PROCESSABLE);
        }
    }

    private void requireValidDelegationId(Integer id) {
        if (id == null || id <= 0) {
            throw new BadRequestException(DelegationMessages.INVALID_DELEGATION_ID);
        }
    }

    private User getCurrentDelegatingStaff() {
        User user = getAuthenticatedUser();
        if (user.getRole() == null) {
            throw new AccessDeniedException(DelegationMessages.ONLY_ACADEMICIAN);
        }
        String roleName = user.getRole().getRoleName();
        if (!RoleType.ACADEMICIAN.name().equals(roleName)
                && !RoleType.HOD.name().equals(roleName)
                && !RoleType.ASSISTANT.name().equals(roleName)) {
            throw new AccessDeniedException(DelegationMessages.ONLY_ACADEMICIAN);
        }
        return user;
    }

    private User getCurrentDecisionUser() {
        User user = getAuthenticatedUser();
        String role = user.getRole() == null ? null : user.getRole().getRoleName();
        if (!(RoleType.ACADEMICIAN.name().equals(role) || RoleType.HOD.name().equals(role)) && !RoleType.ASSISTANT.name().equals(role)) {
            throw new AccessDeniedException(DelegationMessages.ONLY_TARGET_STAFF);
        }
        return user;
    }

    private void transitionStatus(DelegationLog log, DelegationStatus target) {
        transitionStatus(log, target, LocalDateTime.now(APP_ZONE));
    }

    private void transitionStatus(DelegationLog log, DelegationStatus target, LocalDateTime changedAt) {
        final DelegationStatus current;
        try {
            current = DelegationStatus.valueOf(log.getDelegationStatus());
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new ConflictException(DelegationMessages.INVALID_STATUS_TRANSITION);
        }
        if (!current.canTransitionTo(target)) {
            throw new ConflictException(DelegationMessages.INVALID_STATUS_TRANSITION);
        }
        log.setDelegationStatus(target.name());
        log.setUpdatedAt(changedAt);
        recordStatus(log, target, changedAt);

        if (target == DelegationStatus.REJECTED || target == DelegationStatus.EXPIRED) {
            waitlistService.processWaitlistForSlot(log.getAppointment().getSlot(), changedAt);
        }
    }

    private void recordStatus(
            DelegationLog delegation,
            DelegationStatus status,
            LocalDateTime changedAt) {
        DelegationStatusHistory history = new DelegationStatusHistory();
        history.setDelegation(delegation);
        history.setStatus(status.name());
        history.setChangedAt(changedAt);
        delegationStatusHistoryRepository.save(history);
    }

    private User getCurrentStudent() {
        return getCurrentUserWithRole(RoleType.STUDENT, DelegationMessages.ONLY_STUDENT);
    }

    private User getCurrentHistoryUser() {
        User user = getAuthenticatedUser();
        String role = user.getRole() == null ? null : user.getRole().getRoleName();
        if (!RoleType.ACADEMICIAN.name().equals(role) && !RoleType.HOD.name().equals(role) && !RoleType.ASSISTANT.name().equals(role)) {
            throw new AccessDeniedException(DelegationMessages.HISTORY_ACCESS_DENIED);
        }
        return user;
    }

    private User getCurrentUserWithRole(RoleType role, String message) {
        User user = getAuthenticatedUser();
        if (user.getRole() == null) {
            throw new AccessDeniedException(message);
        }
        String roleName = user.getRole().getRoleName();
        boolean isMatch = role.name().equals(roleName);
        if (role == RoleType.ACADEMICIAN && RoleType.HOD.name().equals(roleName)) {
            isMatch = true;
        }
        if (!isMatch) {
            throw new AccessDeniedException(message);
        }
        return user;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails details)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return details.getUser();
    }
}
