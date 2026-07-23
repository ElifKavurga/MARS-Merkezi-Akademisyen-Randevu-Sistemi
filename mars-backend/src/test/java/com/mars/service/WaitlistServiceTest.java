package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import com.mars.dto.NotificationCreateRequest;
import com.mars.dto.notification.WaitlistNotificationRequest;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.WaitlistEntry;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.NotificationType;
import com.mars.enums.WaitlistNotificationEvent;
import com.mars.enums.WaitlistStatus;
import com.mars.mapper.WaitlistEntryMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.WaitlistEntryRepository;

@ExtendWith(MockitoExtension.class)
class WaitlistServiceTest {

    @Mock private WaitlistEntryRepository waitlistEntryRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private AvailabilitySlotRepository availabilitySlotRepository;
    @Mock private NotificationService notificationService;
    @Mock private WaitlistNotificationPublisher waitlistNotificationPublisher;

    private WaitlistService service;
    private WaitlistOfferScheduler scheduler;
    private WaitlistEntryMapper mapper;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        mapper = new WaitlistEntryMapper();
        service = new WaitlistService(
            waitlistEntryRepository,
            appointmentRepository,
            availabilitySlotRepository,
            notificationService,
            waitlistNotificationPublisher,
            mapper
        );
        scheduler = new WaitlistOfferScheduler(waitlistEntryRepository, service);
        now = LocalDateTime.of(2026, 7, 23, 14, 0);
    }

    @Test
    void slotFreed_offersToFirstEligibleWaitingStudent() {
        AvailabilitySlot slot = createSlot(10, now.plusDays(1));
        WaitlistEntry entry1 = createWaitlistEntry(1, "WAITING", now.minusHours(2));
        WaitlistEntry entry2 = createWaitlistEntry(2, "WAITING", now.minusHours(1));

        when(waitlistEntryRepository.findActiveWaitlistEntriesForStaff(eq(10), any(PageRequest.class)))
                .thenReturn(List.of(entry1, entry2));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(eq(1), any()))
                .thenReturn(false);
        when(waitlistEntryRepository.existsActiveOfferForSlot(eq(1), any()))
                .thenReturn(false);

        service.processWaitlistForSlot(slot, now);

        verify(waitlistEntryRepository, times(1)).save(entry1);
        assertThat(entry1.getWaitlistStatus()).isEqualTo(WaitlistStatus.NOTIFIED.name());
        assertThat(entry1.getSlot()).isEqualTo(slot);

        ArgumentCaptor<WaitlistNotificationRequest> captor = ArgumentCaptor.forClass(WaitlistNotificationRequest.class);
        verify(waitlistNotificationPublisher, times(1)).publish(captor.capture());
        assertThat(captor.getValue().event()).isEqualTo(WaitlistNotificationEvent.TURN_AVAILABLE);
    }

    @Test
    void schedulerExpiredOffers_marksExpiredAndOffersToNext() {
        AvailabilitySlot slot = createSlot(10, now.plusDays(1));
        WaitlistEntry entry1 = createWaitlistEntry(1, "NOTIFIED", now.minusHours(2));
        entry1.setSlot(slot);
        entry1.setOfferedAt(now.minusHours(2)); // Expired

        WaitlistEntry entry2 = createWaitlistEntry(2, "WAITING", now.minusHours(1));

        when(waitlistEntryRepository.findExpiredOffers(eq(WaitlistStatus.NOTIFIED.name()), any()))
                .thenReturn(List.of(entry1));
        when(waitlistEntryRepository.findById(1)).thenReturn(Optional.of(entry1));
        
        // Mocking next candidate lookup
        when(waitlistEntryRepository.findActiveWaitlistEntriesForStaff(eq(10), any()))
                .thenReturn(List.of(entry2));

        scheduler.checkExpiredOffers();

        verify(waitlistEntryRepository, times(1)).save(entry1);
        assertThat(entry1.getWaitlistStatus()).isEqualTo(WaitlistStatus.EXPIRED.name());

        // Verify the next student was offered the slot
        verify(waitlistEntryRepository, times(1)).save(entry2);
        assertThat(entry2.getWaitlistStatus()).isEqualTo(WaitlistStatus.NOTIFIED.name());
        assertThat(entry2.getSlot()).isEqualTo(slot);
    }

    private AvailabilitySlot createSlot(Integer staffId, LocalDateTime dateTime) {
        User staff = new User();
        staff.setUserId(staffId);
        staff.setFullName("Staff Member");

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotId(1);
        slot.setStaff(staff);
        slot.setSlotDate(dateTime.toLocalDate());
        slot.setStartTime(dateTime.toLocalTime());
        slot.setEndTime(dateTime.plusMinutes(30).toLocalTime());
        slot.setIsBlocked(false);
        slot.setMeetingType("FACE_TO_FACE");
        return slot;
    }

    private WaitlistEntry createWaitlistEntry(Integer id, String status, LocalDateTime requestedAt) {
        User student = new User();
        student.setUserId(100 + id);
        student.setFullName("Student " + id);

        AppointmentCategory category = new AppointmentCategory();
        category.setCategoryId(5);
        category.setCategoryName("Category 5");
        category.setDurationMinutes(30);

        User staff = new User();
        staff.setUserId(10);
        staff.setFullName("Staff Member");

        WaitlistEntry entry = new WaitlistEntry();
        entry.setWaitlistEntryId(id);
        entry.setStudent(student);
        entry.setStaff(staff);
        entry.setCategory(category);
        entry.setWaitlistStatus(status);
        entry.setRequestedAt(requestedAt);
        return entry;
    }
}
