package com.mars.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.DelegationMessages;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.CreateDelegationRequest;
import com.mars.dto.DelegationResponse;
import com.mars.dto.DelegationTargetResponse;
import com.mars.dto.NotificationCreateRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.DelegationLog;
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
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DelegationService {
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final long STUDENT_APPROVAL_MINUTES = 60;
    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(), AppointmentStatus.APPROVED.name());
    private static final Set<String> TARGET_ROLES = Set.of(
            RoleType.ACADEMICIAN.name(), RoleType.ASSISTANT.name());

    private final DelegationLogRepository delegationLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentRescheduleRequestRepository appointmentRescheduleRequestRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final CourseAssignmentRepository courseAssignmentRepository;
    private final UserRepository userRepository;
    private final DelegationMapper delegationMapper;
    private final AvailabilitySlotService availabilitySlotService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<DelegationTargetResponse> getDelegationTargets(Integer appointmentId) {
        User academician = getCurrentAcademician();
        Appointment appointment = getOwnedAppointment(appointmentId, academician);
        validateAppointmentStatus(appointment.getAppointmentStatus());
        requireCourse(appointment);

        return userRepository.findActiveUsersByRoleNamesExcludingUser(
                        TARGET_ROLES, academician.getUserId())
                .stream()
                .map(user -> toTargetResponse(appointment, user))
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional
    public DelegationResponse createDelegation(CreateDelegationRequest request) {
        User academician = getCurrentAcademician();
        if (request.getAppointmentId() == null) {
            throw new BadRequestException(DelegationMessages.APPOINTMENT_REQUIRED);
        }
        Integer targetUserId = request.resolveTargetUserId();
        if (targetUserId == null) {
            throw new BadRequestException(DelegationMessages.TARGET_REQUIRED);
        }

        Appointment appointment = getOwnedAppointmentForUpdate(request.getAppointmentId(), academician);
        validateAppointmentStatus(appointment.getAppointmentStatus());
        requireCourse(appointment);

        User target = userRepository.findByIdWithRoleAndDepartment(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.TARGET_NOT_FOUND));
        validateTarget(target, academician);

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

        DelegationLog log = delegationMapper.toEntity(appointment, academician, target, now);
        log.setTargetSlot(targetTemplate);
        log.setTargetSlotDate(selectedSlot.getSlotDate());
        log.setTargetStartTime(selectedSlot.getStartTime());
        log.setTargetEndTime(selectedSlot.getEndTime());
        log.setApprovalRequired(approvalRequired);
        if (approvalRequired) {
            log.setDelegationStatus(DelegationStatus.PENDING_STUDENT_APPROVAL.name());
            log.setStudentApprovalExpiresAt(now.plusMinutes(STUDENT_APPROVAL_MINUTES));
            log.setSlotLockStatus(SlotLockStatus.LOCKED.name());
        }

        DelegationLog saved = delegationLogRepository.save(log);
        if (approvalRequired) {
            notificationService.createPreparedEmailNotification(
                    appointment.getStudent(),
                    "DELEGATION_STUDENT_APPROVAL",
                    "Randevu yönlendirme onayı",
                    "Randevunuz farklı bir personele yönlendirilmek isteniyor.",
                    saved);
        } else {
            createDelegationNotification(
                    saved,
                    saved.getDelegatedToUser(),
                    NotificationType.DELEGATION_REQUEST,
                    "Delegasyon Talebi",
                    "Yeni bir randevu delegasyon talebiniz bulunuyor.");
        }
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getIncomingDelegations() {
        User assistant = getCurrentAssistant();
        return delegationLogRepository.findIncomingByAssistantIdAndStatus(
                        assistant.getUserId(), DelegationStatus.PENDING.name())
                .stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DelegationResponse> getDelegationHistory() {
        User currentUser = getCurrentHistoryUser();
        String roleName = currentUser.getRole().getRoleName();
        List<DelegationLog> history = RoleType.ACADEMICIAN.name().equals(roleName)
                ? delegationLogRepository.findHistoryByDelegatedByUserId(currentUser.getUserId())
                : delegationLogRepository.findHistoryByDelegatedToUserId(currentUser.getUserId());
        return history.stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DelegationResponse getDelegation(Integer delegationId) {
        requireValidDelegationId(delegationId);
        User academician = getCurrentAcademician();
        DelegationLog log = delegationLogRepository.findByIdWithDetails(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.DELEGATION_NOT_FOUND));
        if (!Objects.equals(log.getDelegatedByUser().getUserId(), academician.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.ACCESS_DENIED);
        }
        return delegationMapper.toResponse(log);
    }

    @Transactional
    public DelegationResponse acceptDelegation(Integer delegationId) {
        User assistant = getCurrentAssistant();
        DelegationLog log = getOwnedPendingDelegationForDecision(delegationId, assistant);
        completeTransfer(log, assistant);
        log.setDelegationStatus(DelegationStatus.ACCEPTED.name());
        log.setUpdatedAt(LocalDateTime.now(APP_ZONE));
        delegationLogRepository.save(log);
        createDelegationNotification(
                log,
                log.getDelegatedByUser(),
                NotificationType.DELEGATION_ACCEPTED,
                "Delegasyon Kabul Edildi",
                "Delegasyon talebiniz kabul edildi.");
        return toResponse(log);
    }

    @Transactional
    public DelegationResponse rejectDelegation(Integer delegationId) {
        User assistant = getCurrentAssistant();
        DelegationLog log = getOwnedPendingDelegationForDecision(delegationId, assistant);
        validateAppointmentProcessable(log.getAppointment().getAppointmentStatus());
        log.setDelegationStatus(DelegationStatus.REJECTED.name());
        log.setUpdatedAt(LocalDateTime.now(APP_ZONE));
        delegationLogRepository.save(log);
        createDelegationNotification(
                log,
                log.getDelegatedByUser(),
                NotificationType.DELEGATION_REJECTED,
                "Delegasyon Reddedildi",
                "Delegasyon talebiniz reddedildi.");
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
                .message(message)
                .relatedAppointmentId(delegation.getAppointment().getAppointmentId())
                .relatedDelegationId(delegation.getDelegationId())
                .build());
    }

    @Transactional
    public List<DelegationResponse> getPendingStudentApprovals() {
        User student = getCurrentStudent();
        expirePendingApprovals(LocalDateTime.now(APP_ZONE));
        return delegationLogRepository.findStudentApprovals(
                        student.getUserId(), DelegationStatus.PENDING_STUDENT_APPROVAL.name())
                .stream().map(delegationMapper::toResponse).toList();
    }

    @Transactional(noRollbackFor = ConflictException.class)
    public DelegationResponse acceptStudentApproval(Integer delegationId) {
        User student = getCurrentStudent();
        DelegationLog log = getStudentApprovalForDecision(delegationId, student);
        completeTransfer(log, log.getDelegatedToUser());
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        log.setDelegationStatus(DelegationStatus.ACCEPTED.name());
        log.setSlotLockStatus(SlotLockStatus.CONSUMED.name());
        log.setUpdatedAt(now);
        delegationLogRepository.save(log);
        notificationService.createPreparedEmailNotification(
                log.getDelegatedByUser(),
                "DELEGATION_STUDENT_ACCEPTED",
                "Delegasyon kabul edildi",
                "Öğrenci randevu yönlendirmesini kabul etti.",
                log);
        return toResponse(log);
    }

    @Transactional(noRollbackFor = ConflictException.class)
    public DelegationResponse rejectStudentApproval(Integer delegationId) {
        User student = getCurrentStudent();
        DelegationLog log = getStudentApprovalForDecision(delegationId, student);
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        log.setDelegationStatus(DelegationStatus.STUDENT_REJECTED.name());
        log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
        log.setUpdatedAt(now);
        delegationLogRepository.save(log);
        notificationService.createPreparedEmailNotification(
                log.getDelegatedByUser(),
                "DELEGATION_STUDENT_REJECTED",
                "Delegasyon reddedildi",
                "Öğrenci randevu yönlendirmesini reddetti.",
                log);
        return toResponse(log);
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expireStudentApprovals() {
        expirePendingApprovals(LocalDateTime.now(APP_ZONE));
    }

    private void expirePendingApprovals(LocalDateTime now) {
        List<DelegationLog> expired = delegationLogRepository.findExpiredStudentApprovals(
                DelegationStatus.PENDING_STUDENT_APPROVAL.name(), now);
        for (DelegationLog log : expired) {
            log.setDelegationStatus(DelegationStatus.EXPIRED.name());
            log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
            log.setUpdatedAt(now);
            notificationService.createPreparedEmailNotification(
                    log.getDelegatedByUser(),
                    "DELEGATION_EXPIRED",
                    "Delegasyon süresi doldu",
                    "Öğrenci bir saat içinde yanıt vermediği için delegasyon iptal edildi.",
                    log);
        }
        delegationLogRepository.saveAll(expired);
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
            log.setDelegationStatus(DelegationStatus.EXPIRED.name());
            log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
            log.setUpdatedAt(now);
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
            log.setDelegationStatus(DelegationStatus.EXPIRED.name());
            log.setSlotLockStatus(SlotLockStatus.RELEASED.name());
            log.setUpdatedAt(LocalDateTime.now(APP_ZONE));
            delegationLogRepository.save(log);
            throw new ConflictException(DelegationMessages.STUDENT_APPROVAL_EXPIRED);
        }
        return log;
    }

    private DelegationLog getOwnedPendingDelegationForDecision(Integer delegationId, User assistant) {
        requireValidDelegationId(delegationId);
        DelegationLog log = delegationLogRepository.findByIdForUpdate(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException(DelegationMessages.DELEGATION_NOT_FOUND));
        if (!Objects.equals(log.getDelegatedToUser().getUserId(), assistant.getUserId())) {
            throw new AccessDeniedException(DelegationMessages.DECISION_ACCESS_DENIED);
        }
        if (!DelegationStatus.PENDING.name().equals(log.getDelegationStatus())) {
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
    }

    private boolean isRelatedCourseAssistant(Appointment appointment, User target) {
        return RoleType.ASSISTANT.name().equals(target.getRole().getRoleName())
                && courseAssignmentRepository.existsByCourse_CourseIdAndAssistant_UserId(
                        appointment.getCourse().getCourseId(), target.getUserId());
    }

    private void validateNoPendingDelegation(Integer appointmentId) {
        if (delegationLogRepository.existsByAppointment_AppointmentIdAndDelegationStatus(
                appointmentId, DelegationStatus.PENDING.name())
                || delegationLogRepository.existsByAppointment_AppointmentIdAndDelegationStatus(
                        appointmentId, DelegationStatus.PENDING_STUDENT_APPROVAL.name())) {
            throw new ConflictException(DelegationMessages.PENDING_EXISTS);
        }
    }

    private void requireCourse(Appointment appointment) {
        if (appointment.getCourse() == null || appointment.getCourse().getCourseId() == null) {
            throw new BadRequestException(DelegationMessages.COURSE_REQUIRED);
        }
    }

    private void rejectOtherPendingDelegations(Integer appointmentId, Integer acceptedId, LocalDateTime now) {
        List<DelegationLog> others = delegationLogRepository
                .findByAppointment_AppointmentIdAndDelegationStatusAndDelegationIdNot(
                        appointmentId, DelegationStatus.PENDING.name(), acceptedId);
        for (DelegationLog other : others) {
            other.setDelegationStatus(DelegationStatus.REJECTED.name());
            other.setUpdatedAt(now);
        }
        delegationLogRepository.saveAll(others);
    }

    private DelegationResponse toResponse(DelegationLog log) {
        return delegationMapper.toResponse(
                delegationLogRepository.findByIdWithDetails(log.getDelegationId()).orElse(log));
    }

    private void validateAppointmentProcessable(String status) {
        if (!AppointmentStatus.PENDING.name().equals(status)) {
            throw new ConflictException(DelegationMessages.APPOINTMENT_NOT_PROCESSABLE);
        }
    }

    private void validateAppointmentStatus(String status) {
        if (!AppointmentStatus.PENDING.name().equals(status)) {
            throw new BadRequestException(DelegationMessages.APPOINTMENT_NOT_PROCESSABLE);
        }
    }

    private void requireValidDelegationId(Integer id) {
        if (id == null || id <= 0) {
            throw new BadRequestException(DelegationMessages.INVALID_DELEGATION_ID);
        }
    }

    private User getCurrentAcademician() {
        return getCurrentUserWithRole(RoleType.ACADEMICIAN, DelegationMessages.ONLY_ACADEMICIAN);
    }

    private User getCurrentAssistant() {
        return getCurrentUserWithRole(RoleType.ASSISTANT, DelegationMessages.ONLY_ASSISTANT);
    }

    private User getCurrentStudent() {
        return getCurrentUserWithRole(RoleType.STUDENT, DelegationMessages.ONLY_STUDENT);
    }

    private User getCurrentHistoryUser() {
        User user = getAuthenticatedUser();
        String role = user.getRole() == null ? null : user.getRole().getRoleName();
        if (!RoleType.ACADEMICIAN.name().equals(role) && !RoleType.ASSISTANT.name().equals(role)) {
            throw new AccessDeniedException(DelegationMessages.HISTORY_ACCESS_DENIED);
        }
        return user;
    }

    private User getCurrentUserWithRole(RoleType role, String message) {
        User user = getAuthenticatedUser();
        if (user.getRole() == null || !role.name().equals(user.getRole().getRoleName())) {
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
