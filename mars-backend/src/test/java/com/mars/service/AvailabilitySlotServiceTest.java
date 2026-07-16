package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.dto.AvailabilitySlotBlockRequest;
import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.dto.AvailabilitySlotUpdateRequest;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.AvailabilitySlotMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class AvailabilitySlotServiceTest {

    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AvailabilitySlotMapper availabilitySlotMapper;

    @InjectMocks
    private AvailabilitySlotService availabilitySlotService;

    private User academician;
    private AvailabilitySlot slot;
    private AvailabilitySlotResponseDto responseDto;

    @BeforeEach
    void setUp() {
        academician = new User();
        academician.setUserId(10);

        slot = new AvailabilitySlot();
        slot.setSlotId(1);
        slot.setStaff(academician);
        slot.setSlotDate(LocalDate.of(2026, 7, 20));
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(12, 0));
        slot.setIsBlocked(false);

        responseDto = AvailabilitySlotResponseDto.builder()
                .slotId(1)
                .slotDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .isBlocked(false)
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(academician);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getMySlots_returnsOwnedSlotsMapped() {
        when(availabilitySlotRepository.findByStaffIdOrderBySlotDateAscStartTimeAsc(10))
                .thenReturn(List.of(slot));
        when(availabilitySlotMapper.toResponse(slot)).thenReturn(responseDto);

        List<AvailabilitySlotResponseDto> result = availabilitySlotService.getMySlots();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSlotId()).isEqualTo(1);
        assertThat(result.get(0).getIsBlocked()).isFalse();
        verify(availabilitySlotRepository).findByStaffIdOrderBySlotDateAscStartTimeAsc(10);
        verify(availabilitySlotMapper).toResponse(slot);
    }

    @Test
    void getMySlots_emptyList_returnsEmpty() {
        when(availabilitySlotRepository.findByStaffIdOrderBySlotDateAscStartTimeAsc(10))
                .thenReturn(List.of());

        List<AvailabilitySlotResponseDto> result = availabilitySlotService.getMySlots();

        assertThat(result).isEmpty();
    }

    @Test
    void getMySlots_withoutAuthentication_throwsAccessDenied() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> availabilitySlotService.getMySlots())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createSlot_successfulCreation() {
        LocalDate futureDate = LocalDate.now().plusDays(1);
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                futureDate,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0));

        when(availabilitySlotRepository.existsOverlappingSlot(10, futureDate, LocalTime.of(10, 0), LocalTime.of(12, 0)))
                .thenReturn(false);
        when(availabilitySlotMapper.toEntity(request, academician)).thenReturn(slot);
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(availabilitySlotMapper.toResponse(slot)).thenReturn(responseDto);

        AvailabilitySlotResponseDto result = availabilitySlotService.createSlot(request);

        assertThat(result.getSlotId()).isEqualTo(1);
        verify(availabilitySlotRepository).save(slot);
    }

    @Test
    void createSlot_overlappingSlot_throwsConflict() {
        LocalDate futureDate = LocalDate.now().plusDays(1);
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                futureDate,
                LocalTime.of(10, 30),
                LocalTime.of(12, 0));

        when(availabilitySlotRepository.existsOverlappingSlot(
                eq(10), eq(futureDate), eq(LocalTime.of(10, 30)), eq(LocalTime.of(12, 0))))
                .thenReturn(true);

        assertThatThrownBy(() -> availabilitySlotService.createSlot(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("çakışan");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void createSlot_pastDate_throwsBadRequest() {
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                LocalDate.now().minusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(12, 0));

        assertThatThrownBy(() -> availabilitySlotService.createSlot(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Geçmiş tarih");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void createSlot_startAfterEnd_throwsBadRequest() {
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                LocalDate.now().plusDays(1),
                LocalTime.of(12, 0),
                LocalTime.of(10, 0));

        assertThatThrownBy(() -> availabilitySlotService.createSlot(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Başlangıç saati");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void createSlot_withoutAuthentication_throwsAccessDenied() {
        SecurityContextHolder.clearContext();
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(12, 0));

        assertThatThrownBy(() -> availabilitySlotService.createSlot(request))
                .isInstanceOf(AccessDeniedException.class);

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateSlot_successfulUpdate() {
        LocalDate futureDate = LocalDate.now().plusDays(2);
        AvailabilitySlotUpdateRequest request = new AvailabilitySlotUpdateRequest(
                futureDate,
                LocalTime.of(11, 0),
                LocalTime.of(13, 0));

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(1, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(false);
        when(availabilitySlotRepository.existsOverlappingSlotExcludingId(
                10, futureDate, LocalTime.of(11, 0), LocalTime.of(13, 0), 1))
                .thenReturn(false);
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(availabilitySlotMapper.toResponse(slot)).thenReturn(responseDto);

        AvailabilitySlotResponseDto result = availabilitySlotService.updateSlot(1, request);

        assertThat(result.getSlotId()).isEqualTo(1);
        verify(availabilitySlotMapper).updateEntity(slot, request);
        verify(availabilitySlotRepository).save(slot);
    }

    @Test
    void updateSlot_overlappingSlot_throwsConflict() {
        LocalDate futureDate = LocalDate.now().plusDays(2);
        AvailabilitySlotUpdateRequest request = new AvailabilitySlotUpdateRequest(
                futureDate,
                LocalTime.of(11, 0),
                LocalTime.of(13, 0));

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(1, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(false);
        when(availabilitySlotRepository.existsOverlappingSlotExcludingId(
                10, futureDate, LocalTime.of(11, 0), LocalTime.of(13, 0), 1))
                .thenReturn(true);

        assertThatThrownBy(() -> availabilitySlotService.updateSlot(1, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("çakışan");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateSlot_pastDate_throwsBadRequest() {
        AvailabilitySlotUpdateRequest request = new AvailabilitySlotUpdateRequest(
                LocalDate.now().minusDays(1),
                LocalTime.of(11, 0),
                LocalTime.of(13, 0));

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> availabilitySlotService.updateSlot(1, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Geçmiş tarih");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateSlot_startAfterEnd_throwsBadRequest() {
        AvailabilitySlotUpdateRequest request = new AvailabilitySlotUpdateRequest(
                LocalDate.now().plusDays(2),
                LocalTime.of(13, 0),
                LocalTime.of(11, 0));

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> availabilitySlotService.updateSlot(1, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Başlangıç saati");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateSlot_otherAcademicianSlot_throwsAccessDenied() {
        User other = new User();
        other.setUserId(99);
        slot.setStaff(other);

        AvailabilitySlotUpdateRequest request = new AvailabilitySlotUpdateRequest(
                LocalDate.now().plusDays(2),
                LocalTime.of(11, 0),
                LocalTime.of(13, 0));

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> availabilitySlotService.updateSlot(1, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("güncelleme yetkiniz yok");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateSlot_activeAppointment_throwsConflict() {
        LocalDate futureDate = LocalDate.now().plusDays(2);
        AvailabilitySlotUpdateRequest request = new AvailabilitySlotUpdateRequest(
                futureDate,
                LocalTime.of(11, 0),
                LocalTime.of(13, 0));

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(1, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(true);

        assertThatThrownBy(() -> availabilitySlotService.updateSlot(1, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("aktif randevular");

        verify(availabilitySlotRepository, never()).save(any());
        verify(availabilitySlotRepository, never()).existsOverlappingSlotExcludingId(
                any(), any(), any(), any(), any());
    }

    @Test
    void updateBlockedStatus_successfulBlock() {
        AvailabilitySlotBlockRequest request = new AvailabilitySlotBlockRequest(true);
        AvailabilitySlotResponseDto blockedResponse = AvailabilitySlotResponseDto.builder()
                .slotId(1)
                .slotDate(slot.getSlotDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .isBlocked(true)
                .build();

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(1, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(false);
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(availabilitySlotMapper.toResponse(slot)).thenReturn(blockedResponse);

        AvailabilitySlotResponseDto result = availabilitySlotService.updateBlockedStatus(1, request);

        assertThat(result.getIsBlocked()).isTrue();
        verify(availabilitySlotMapper).applyBlockStatus(slot, request);
        verify(availabilitySlotRepository).save(slot);
    }

    @Test
    void updateBlockedStatus_successfulUnblock() {
        slot.setIsBlocked(true);
        AvailabilitySlotBlockRequest request = new AvailabilitySlotBlockRequest(false);
        AvailabilitySlotResponseDto availableResponse = AvailabilitySlotResponseDto.builder()
                .slotId(1)
                .slotDate(slot.getSlotDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .isBlocked(false)
                .build();

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(availabilitySlotMapper.toResponse(slot)).thenReturn(availableResponse);

        AvailabilitySlotResponseDto result = availabilitySlotService.updateBlockedStatus(1, request);

        assertThat(result.getIsBlocked()).isFalse();
        verify(appointmentRepository, never()).existsBySlot_SlotIdAndAppointmentStatusIn(any(), any());
        verify(availabilitySlotMapper).applyBlockStatus(slot, request);
        verify(availabilitySlotRepository).save(slot);
    }

    @Test
    void updateBlockedStatus_sameStatusAgain_throwsBadRequest() {
        slot.setIsBlocked(true);
        AvailabilitySlotBlockRequest request = new AvailabilitySlotBlockRequest(true);

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> availabilitySlotService.updateBlockedStatus(1, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("zaten engelli");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateBlockedStatus_otherAcademicianSlot_throwsAccessDenied() {
        User other = new User();
        other.setUserId(99);
        slot.setStaff(other);
        AvailabilitySlotBlockRequest request = new AvailabilitySlotBlockRequest(true);

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> availabilitySlotService.updateBlockedStatus(1, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("durumunu değiştirme yetkiniz yok");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateBlockedStatus_pendingAppointment_throwsConflict() {
        AvailabilitySlotBlockRequest request = new AvailabilitySlotBlockRequest(true);

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(1, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(true);

        assertThatThrownBy(() -> availabilitySlotService.updateBlockedStatus(1, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("slot engellenemez");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateBlockedStatus_approvedAppointment_throwsConflict() {
        AvailabilitySlotBlockRequest request = new AvailabilitySlotBlockRequest(true);

        when(availabilitySlotRepository.findByIdWithStaff(1)).thenReturn(Optional.of(slot));
        when(appointmentRepository.existsBySlot_SlotIdAndAppointmentStatusIn(1, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(true);

        assertThatThrownBy(() -> availabilitySlotService.updateBlockedStatus(1, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("aktif randevular");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void updateBlockedStatus_slotNotFound_throwsResourceNotFound() {
        AvailabilitySlotBlockRequest request = new AvailabilitySlotBlockRequest(true);

        when(availabilitySlotRepository.findByIdWithStaff(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> availabilitySlotService.updateBlockedStatus(99, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("bulunamadı");

        verify(availabilitySlotRepository, never()).save(any());
    }
}
