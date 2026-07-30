package com.mars.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mars.AppointmentMessages;
import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.StudentAppointmentRestrictionResponse;
import com.mars.dto.WaitlistEntryResponseDto;
import com.mars.dto.notification.WaitlistNotificationRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.WaitlistEntry;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.NotificationType;
import com.mars.enums.RoleType;
import com.mars.enums.WaitlistNotificationEvent;
import com.mars.enums.WaitlistStatus;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.exception.StudentAppointmentRestrictedException;
import com.mars.mapper.WaitlistEntryMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.WaitlistEntryRepository;
import com.mars.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaitlistService {

    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private static final List<String> ACTIVE_APPOINTMENT_STATUSES = List.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name(),
            "RESCHEDULED_APPROVED");

    private final WaitlistEntryRepository waitlistEntryRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final NotificationService notificationService;
    private final WaitlistNotificationPublisher waitlistNotificationPublisher;
    private final WaitlistEntryMapper waitlistEntryMapper;
    private final NoShowPenaltyService noShowPenaltyService;

    @Value("${mars.waitlist.offer-duration-minutes:60}")
    private long offerDurationMinutes;

    @Transactional(readOnly = true)
    public List<WaitlistEntryResponseDto> getStudentWaitlistEntries() {
        User student = getCurrentStudent();
        return waitlistEntryRepository.findAll().stream()
            .filter(entry -> entry.getStudent().getUserId().equals(student.getUserId()))
            .map(entry -> waitlistEntryMapper.toResponseDto(entry, offerDurationMinutes))
            .toList();
    }

    @Transactional
    public void processWaitlistForSlot(AvailabilitySlot slot, LocalDateTime now) {
        if (slot == null) return;

        // 1. Check if slot is in the future
        if (slot.getSlotDate().isBefore(now.toLocalDate()) || 
           (slot.getSlotDate().isEqual(now.toLocalDate()) && slot.getEndTime().isBefore(now.toLocalTime()))) {
            return;
        }

        // 2. Check if the slot is blocked
        if (Boolean.TRUE.equals(slot.getIsBlocked())) {
            return;
        }

        // 3. Check if there is an active appointment on this slot
        boolean hasActiveApp = appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(
            slot.getSlotId(),
            ACTIVE_APPOINTMENT_STATUSES
        );
        if (hasActiveApp) {
            return;
        }

        // 4. Check if there is an active offer on this slot
        LocalDateTime cutoffTime = now.minusMinutes(offerDurationMinutes);
        boolean hasActiveOffer = waitlistEntryRepository.existsActiveOfferForSlot(
            slot.getSlotId(),
            cutoffTime
        );
        if (hasActiveOffer) {
            return;
        }

        // 5. Find the first eligible waiting student
        WaitlistEntry entry = findFirstEligibleWaitingEntry(slot);
        if (entry == null) {
            return;
        }

        // 6. Make the offer
        entry.setSlot(slot);
        entry.setOfferedAt(now);
        entry.setWaitlistStatus(WaitlistStatus.NOTIFIED.name());
        waitlistEntryRepository.save(entry);

        // Send notifications
        sendOfferNotifications(entry);
    }

    @Transactional
    public WaitlistEntryResponseDto acceptOffer(Integer waitlistEntryId) {
        User student = getCurrentStudent();
        WaitlistEntry entry = waitlistEntryRepository.findById(waitlistEntryId)
            .orElseThrow(() -> new ResourceNotFoundException("Bekleme listesi kaydı bulunamadı."));

        if (!entry.getStudent().getUserId().equals(student.getUserId())) {
            throw new AccessDeniedException("Bu bekleme listesi teklifini kabul etme yetkiniz yok.");
        }

        if (!WaitlistStatus.NOTIFIED.name().equals(entry.getWaitlistStatus())) {
            throw new ConflictException("Bu bekleme listesi kaydı için aktif teklif bulunmuyor.");
        }

        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        noShowPenaltyService.resolveActiveRestriction(student, now.toLocalDate())
            .map(this::waitlistRestriction)
            .ifPresent(exception -> {
                throw exception;
            });
        if (entry.getOfferedAt().plusMinutes(offerDurationMinutes).isBefore(now)) {
            // Expire it
            entry.setWaitlistStatus(WaitlistStatus.EXPIRED.name());
            waitlistEntryRepository.save(entry);
            
            // Trigger next offer on this slot
            processWaitlistForSlot(entry.getSlot(), now);
            
            throw new ConflictException("Bekleme listesi teklifinin süresi doldu.");
        }

        AvailabilitySlot slot = entry.getSlot();
        ensureWaitlistOfferStillBookable(entry, student, slot);

        // Accept it:
        // 1. Mark waitlist entry as CONVERTED
        entry.setWaitlistStatus(WaitlistStatus.CONVERTED.name());
        waitlistEntryRepository.save(entry);

        // 2. Create the Appointment
        Appointment appointment = new Appointment();
        appointment.setStudent(entry.getStudent());
        appointment.setStaff(entry.getStaff());
        appointment.setCategory(entry.getCategory());
        appointment.setCourse(entry.getCourse());
        appointment.setSlot(slot);
        appointment.setAppointmentStatus(AppointmentStatus.APPROVED.name()); // Automatically APPROVED
        appointment.setMeetingType(slot.getMeetingType());
        appointment.setIsLimitedDuration(false);
        appointment.setCreatedAt(now);
        appointment.setUpdatedAt(now);
        appointmentRepository.save(appointment);

        // 3. Send notification for appointment approval
        notificationService.createNotification(NotificationCreateRequest.builder()
            .userId(student.getUserId())
            .notificationType(NotificationType.APPOINTMENT_APPROVED)
            .title("Bekleme Listesi Teklifi Kabul Edildi")
            .message("Bekleme listesindeki teklifi kabul ettiniz. Randevunuz onaylandı.")
            .relatedAppointmentId(appointment.getAppointmentId())
            .build());

        // Notify academician about new appointment
        notificationService.createNotification(NotificationCreateRequest.builder()
            .userId(entry.getStaff().getUserId())
            .notificationType(NotificationType.NEW_APPOINTMENT_REQUEST)
            .title("Bekleme Listesinden Randevu Oluşturuldu")
            .message("Bekleme listesindeki öğrenci teklifi kabul etti. Yeni randevu oluşturuldu.")
            .relatedAppointmentId(appointment.getAppointmentId())
            .build());

        return waitlistEntryMapper.toResponseDto(entry, offerDurationMinutes);
    }

    private void ensureWaitlistOfferStillBookable(
            WaitlistEntry entry,
            User student,
            AvailabilitySlot slot) {
        if (slot == null) {
            throw new ResourceNotFoundException(AppointmentMessages.SLOT_NOT_FOUND);
        }
        if (appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(
                slot.getSlotId(), ACTIVE_APPOINTMENT_STATUSES)
                || appointmentRepository.existsOverlappingActiveAppointmentForStaff(
                        entry.getStaff().getUserId(),
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
    }

    @Transactional
    public WaitlistEntryResponseDto rejectOffer(Integer waitlistEntryId) {
        User student = getCurrentStudent();
        WaitlistEntry entry = waitlistEntryRepository.findById(waitlistEntryId)
            .orElseThrow(() -> new ResourceNotFoundException("Bekleme listesi kaydı bulunamadı."));

        if (!entry.getStudent().getUserId().equals(student.getUserId())) {
            throw new AccessDeniedException("Bu bekleme listesi teklifini reddetme yetkiniz yok.");
        }

        if (!WaitlistStatus.NOTIFIED.name().equals(entry.getWaitlistStatus())) {
            throw new ConflictException("Bu bekleme listesi kaydı için aktif teklif bulunmuyor.");
        }

        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        
        // Reject it
        entry.setWaitlistStatus(WaitlistStatus.REJECTED.name());
        waitlistEntryRepository.save(entry);

        // Notify student about rejection
        notificationService.createNotification(NotificationCreateRequest.builder()
            .userId(student.getUserId())
            .notificationType(NotificationType.WAITLIST_CANCELLED)
            .title("Teklif Reddedildi")
            .message("Bekleme listesi teklifini reddettiniz.")
            .build());

        // Trigger next offer on this slot
        processWaitlistForSlot(entry.getSlot(), now);

        return waitlistEntryMapper.toResponseDto(entry, offerDurationMinutes);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireOffer(Integer id, LocalDateTime now) {
        WaitlistEntry entry = waitlistEntryRepository.findById(id).orElse(null);
        if (entry == null || !WaitlistStatus.NOTIFIED.name().equals(entry.getWaitlistStatus())) {
            return;
        }

        // Set to EXPIRED
        entry.setWaitlistStatus(WaitlistStatus.EXPIRED.name());
        waitlistEntryRepository.save(entry);

        // Notify student about expiration
        notificationService.createNotification(NotificationCreateRequest.builder()
            .userId(entry.getStudent().getUserId())
            .notificationType(NotificationType.WAITLIST_CANCELLED)
            .title("Teklif Süresi Doldu")
            .message("Bekleme listesi teklif onay süresi doldu.")
            .build());

        // Trigger next offer on this slot
        processWaitlistForSlot(entry.getSlot(), now);
    }

    private WaitlistEntry findFirstEligibleWaitingEntry(AvailabilitySlot slot) {
        List<WaitlistEntry> entries = waitlistEntryRepository.findActiveWaitlistEntriesForStaff(
            slot.getStaff().getUserId(),
            PageRequest.of(0, 100)
        );
        long slotDuration = Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes();
        for (WaitlistEntry entry : entries) {
            if (entry.getCategory().getDurationMinutes() <= slotDuration) {
                return entry;
            }
        }
        return null;
    }

    private void sendOfferNotifications(WaitlistEntry entry) {
        String reservationInfo = "Rezervasyon hakkınızı %s tarihine kadar onaylayabilirsiniz."
            .formatted(entry.getOfferedAt().plusMinutes(offerDurationMinutes).format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));

        WaitlistNotificationRequest request = new WaitlistNotificationRequest(
            entry.getWaitlistEntryId(),
            entry.getStudent().getUserId(),
            WaitlistNotificationEvent.TURN_AVAILABLE,
            entry.getStudent().getFullName(),
            entry.getStaff().getFullName(),
            entry.getCategory().getCategoryName(),
            entry.getCourse() != null ? "%s - %s".formatted(entry.getCourse().getCourseCode(), entry.getCourse().getCourseName()) : null,
            entry.getSlot().getSlotDate(),
            entry.getSlot().getStartTime(),
            entry.getSlot().getEndTime(),
            reservationInfo
        );

        waitlistNotificationPublisher.publish(request);
    }

    private User getCurrentStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException("Access denied");
        }
        User user = userDetails.getUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!RoleType.STUDENT.name().equals(roleName)) {
            throw new AccessDeniedException("Only students can perform this action");
        }
        return user;
    }

    private StudentAppointmentRestrictedException waitlistRestriction(
            StudentAppointmentRestrictionResponse restriction) {
        return new StudentAppointmentRestrictedException(restriction);
    }
}
