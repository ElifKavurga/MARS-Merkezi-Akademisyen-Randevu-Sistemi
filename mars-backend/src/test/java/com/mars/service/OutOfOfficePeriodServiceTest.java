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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.OutOfOfficePeriodMessages;
import com.mars.dto.OutOfOfficePeriodCreateRequest;
import com.mars.dto.OutOfOfficePeriodResponseDto;
import com.mars.dto.OutOfOfficePeriodUpdateRequest;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.OutOfOfficePeriod;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.ReasonCode;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.mapper.OutOfOfficePeriodMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.OutOfOfficePeriodRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class OutOfOfficePeriodServiceTest {

    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING.name(),
            AppointmentStatus.APPROVED.name());

    @Mock
    private OutOfOfficePeriodRepository outOfOfficePeriodRepository;

    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private OutOfOfficePeriodMapper outOfOfficePeriodMapper;

    @InjectMocks
    private OutOfOfficePeriodService outOfOfficePeriodService;

    private User academician;
    private OutOfOfficePeriod period;
    private OutOfOfficePeriodResponseDto responseDto;

    @BeforeEach
    void setUp() {
        academician = new User();
        academician.setUserId(10);

        period = new OutOfOfficePeriod();
        period.setOutOfOfficeId(1);
        period.setStaff(academician);
        period.setStartDate(LocalDate.of(2026, 8, 1));
        period.setEndDate(LocalDate.of(2026, 8, 5));
        period.setReasonCode(ReasonCode.LEAVE.name());

        responseDto = OutOfOfficePeriodResponseDto.builder()
                .outOfOfficeId(1)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 5))
                .reasonCode(ReasonCode.LEAVE.name())
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
    void getMyPeriods_returnsOwnedPeriodsMapped() {
        when(outOfOfficePeriodRepository.findByStaffIdOrderByStartDateAscEndDateAsc(10))
                .thenReturn(List.of(period));
        when(outOfOfficePeriodMapper.toResponse(period)).thenReturn(responseDto);

        List<OutOfOfficePeriodResponseDto> result = outOfOfficePeriodService.getMyPeriods();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOutOfOfficeId()).isEqualTo(1);
        verify(outOfOfficePeriodRepository).findByStaffIdOrderByStartDateAscEndDateAsc(10);
    }

    @Test
    void getMyPeriods_emptyList_returnsEmpty() {
        when(outOfOfficePeriodRepository.findByStaffIdOrderByStartDateAscEndDateAsc(10))
                .thenReturn(List.of());

        assertThat(outOfOfficePeriodService.getMyPeriods()).isEmpty();
    }

    @Test
    void getMyPeriods_withoutAuthentication_throwsAccessDenied() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> outOfOfficePeriodService.getMyPeriods())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createPeriod_successfulCreation_blocksSlots() {
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(3);
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                start, end, ReasonCode.CONFERENCE.name());

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotId(7);
        slot.setStaff(academician);
        slot.setSlotDate(start);
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(11, 0));
        slot.setIsBlocked(false);

        OutOfOfficePeriod toSave = new OutOfOfficePeriod();
        toSave.setStaff(academician);
        toSave.setStartDate(start);
        toSave.setEndDate(end);
        toSave.setReasonCode(ReasonCode.CONFERENCE.name());

        OutOfOfficePeriod saved = new OutOfOfficePeriod();
        saved.setOutOfOfficeId(2);
        saved.setStaff(academician);
        saved.setStartDate(start);
        saved.setEndDate(end);
        saved.setReasonCode(ReasonCode.CONFERENCE.name());

        when(outOfOfficePeriodRepository.existsOverlappingPeriod(10, start, end)).thenReturn(false);
        when(appointmentRepository.existsActiveAppointmentsForStaffInDateRange(
                eq(10), eq(start), eq(end), eq(ACTIVE_APPOINTMENT_STATUSES)))
                .thenReturn(false);
        when(outOfOfficePeriodMapper.toEntity(request, academician)).thenReturn(toSave);
        when(outOfOfficePeriodRepository.save(toSave)).thenReturn(saved);
        when(availabilitySlotRepository.findByStaff_UserIdAndSlotDateBetween(10, start, end))
                .thenReturn(List.of(slot));
        when(outOfOfficePeriodMapper.toResponse(saved)).thenReturn(
                OutOfOfficePeriodResponseDto.builder()
                        .outOfOfficeId(2)
                        .startDate(start)
                        .endDate(end)
                        .reasonCode(ReasonCode.CONFERENCE.name())
                        .build());

        OutOfOfficePeriodResponseDto result = outOfOfficePeriodService.createPeriod(request);

        assertThat(result.getOutOfOfficeId()).isEqualTo(2);
        assertThat(slot.getIsBlocked()).isTrue();
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<AvailabilitySlot>> slotsCaptor = ArgumentCaptor.forClass(List.class);
        verify(availabilitySlotRepository).saveAll(slotsCaptor.capture());
        assertThat(slotsCaptor.getValue()).containsExactly(slot);
    }

    @Test
    void createPeriod_overlappingOoo_throwsConflict() {
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(2);
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                start, end, ReasonCode.LEAVE.name());

        when(outOfOfficePeriodRepository.existsOverlappingPeriod(10, start, end)).thenReturn(true);

        assertThatThrownBy(() -> outOfOfficePeriodService.createPeriod(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage(OutOfOfficePeriodMessages.OVERLAP);

        verify(outOfOfficePeriodRepository, never()).save(any());
    }

    @Test
    void createPeriod_pastDate_throwsBadRequest() {
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(1),
                ReasonCode.LEAVE.name());

        assertThatThrownBy(() -> outOfOfficePeriodService.createPeriod(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(OutOfOfficePeriodMessages.PAST_DATE);

        verify(outOfOfficePeriodRepository, never()).save(any());
    }

    @Test
    void createPeriod_invalidDateRange_throwsBadRequest() {
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(1),
                ReasonCode.LEAVE.name());

        assertThatThrownBy(() -> outOfOfficePeriodService.createPeriod(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(OutOfOfficePeriodMessages.INVALID_DATE_RANGE);

        verify(outOfOfficePeriodRepository, never()).save(any());
    }

    @Test
    void createPeriod_activeAppointments_throwsConflict() {
        LocalDate start = LocalDate.now().plusDays(1);
        LocalDate end = LocalDate.now().plusDays(2);
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                start, end, ReasonCode.ASSIGNMENT.name());

        when(outOfOfficePeriodRepository.existsOverlappingPeriod(10, start, end)).thenReturn(false);
        when(appointmentRepository.existsActiveAppointmentsForStaffInDateRange(
                eq(10), eq(start), eq(end), eq(ACTIVE_APPOINTMENT_STATUSES)))
                .thenReturn(true);

        assertThatThrownBy(() -> outOfOfficePeriodService.createPeriod(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage(OutOfOfficePeriodMessages.ACTIVE_APPOINTMENTS);

        verify(outOfOfficePeriodRepository, never()).save(any());
        verify(availabilitySlotRepository, never()).saveAll(any());
    }

    @Test
    void createPeriod_withoutAuthentication_throwsAccessDenied() {
        SecurityContextHolder.clearContext();
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(2),
                ReasonCode.OTHER.name());

        assertThatThrownBy(() -> outOfOfficePeriodService.createPeriod(request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updatePeriod_successfulUpdate_reblocksAndUnblocksSlots() {
        LocalDate oldStart = LocalDate.now().plusDays(1);
        LocalDate oldEnd = LocalDate.now().plusDays(5);
        LocalDate newStart = LocalDate.now().plusDays(2);
        LocalDate newEnd = LocalDate.now().plusDays(4);

        period.setOutOfOfficeId(1);
        period.setStartDate(oldStart);
        period.setEndDate(oldEnd);
        period.setReasonCode(ReasonCode.LEAVE.name());

        OutOfOfficePeriodUpdateRequest request = new OutOfOfficePeriodUpdateRequest(
                newStart, newEnd, ReasonCode.CONFERENCE.name());

        AvailabilitySlot leavingSlot = new AvailabilitySlot();
        leavingSlot.setSlotId(11);
        leavingSlot.setSlotDate(oldStart);
        leavingSlot.setIsBlocked(true);

        AvailabilitySlot stayingSlot = new AvailabilitySlot();
        stayingSlot.setSlotId(12);
        stayingSlot.setSlotDate(newStart);
        stayingSlot.setIsBlocked(true);

        AvailabilitySlot newlyCovered = new AvailabilitySlot();
        newlyCovered.setSlotId(13);
        newlyCovered.setSlotDate(newEnd);
        newlyCovered.setIsBlocked(false);

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));
        when(outOfOfficePeriodRepository.existsOverlappingPeriodExcludingId(10, newStart, newEnd, 1))
                .thenReturn(false);
        when(appointmentRepository.existsActiveAppointmentsForStaffInDateRange(
                eq(10), eq(newStart), eq(newEnd), eq(ACTIVE_APPOINTMENT_STATUSES)))
                .thenReturn(false);
        when(outOfOfficePeriodRepository.save(period)).thenReturn(period);
        when(availabilitySlotRepository.findByStaff_UserIdAndSlotDateBetween(10, oldStart, oldEnd))
                .thenReturn(List.of(leavingSlot, stayingSlot));
        when(outOfOfficePeriodRepository.existsOtherPeriodCoveringDate(10, oldStart, 1))
                .thenReturn(false);
        when(availabilitySlotRepository.findByStaff_UserIdAndSlotDateBetween(10, newStart, newEnd))
                .thenReturn(List.of(stayingSlot, newlyCovered));
        when(outOfOfficePeriodMapper.toResponse(period)).thenReturn(
                OutOfOfficePeriodResponseDto.builder()
                        .outOfOfficeId(1)
                        .startDate(newStart)
                        .endDate(newEnd)
                        .reasonCode(ReasonCode.CONFERENCE.name())
                        .build());

        OutOfOfficePeriodResponseDto result = outOfOfficePeriodService.updatePeriod(1, request);

        assertThat(result.getOutOfOfficeId()).isEqualTo(1);
        verify(outOfOfficePeriodMapper).updateEntity(period, request);
        assertThat(leavingSlot.getIsBlocked()).isFalse();
        assertThat(newlyCovered.getIsBlocked()).isTrue();
        assertThat(stayingSlot.getIsBlocked()).isTrue();
    }

    @Test
    void updatePeriod_otherAcademician_throwsAccessDenied() {
        User other = new User();
        other.setUserId(99);
        period.setStaff(other);
        period.setEndDate(LocalDate.now().plusDays(3));

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));

        OutOfOfficePeriodUpdateRequest request = new OutOfOfficePeriodUpdateRequest(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(2),
                ReasonCode.LEAVE.name());

        assertThatThrownBy(() -> outOfOfficePeriodService.updatePeriod(1, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(OutOfOfficePeriodMessages.ACCESS_DENIED);

        verify(outOfOfficePeriodRepository, never()).save(any());
    }

    @Test
    void updatePeriod_overlappingOoo_throwsConflict() {
        period.setStartDate(LocalDate.now().plusDays(1));
        period.setEndDate(LocalDate.now().plusDays(5));

        LocalDate newStart = LocalDate.now().plusDays(2);
        LocalDate newEnd = LocalDate.now().plusDays(6);
        OutOfOfficePeriodUpdateRequest request = new OutOfOfficePeriodUpdateRequest(
                newStart, newEnd, ReasonCode.LEAVE.name());

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));
        when(outOfOfficePeriodRepository.existsOverlappingPeriodExcludingId(10, newStart, newEnd, 1))
                .thenReturn(true);

        assertThatThrownBy(() -> outOfOfficePeriodService.updatePeriod(1, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage(OutOfOfficePeriodMessages.OVERLAP);
    }

    @Test
    void updatePeriod_invalidDateRange_throwsBadRequest() {
        period.setStartDate(LocalDate.now().plusDays(1));
        period.setEndDate(LocalDate.now().plusDays(5));

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));

        OutOfOfficePeriodUpdateRequest request = new OutOfOfficePeriodUpdateRequest(
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(1),
                ReasonCode.LEAVE.name());

        assertThatThrownBy(() -> outOfOfficePeriodService.updatePeriod(1, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(OutOfOfficePeriodMessages.INVALID_DATE_RANGE);
    }

    @Test
    void updatePeriod_pastCompletedOoo_throwsBadRequest() {
        period.setStartDate(LocalDate.now().minusDays(10));
        period.setEndDate(LocalDate.now().minusDays(1));

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));

        OutOfOfficePeriodUpdateRequest request = new OutOfOfficePeriodUpdateRequest(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(2),
                ReasonCode.LEAVE.name());

        assertThatThrownBy(() -> outOfOfficePeriodService.updatePeriod(1, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(OutOfOfficePeriodMessages.PAST_PERIOD_NOT_UPDATABLE);
    }

    @Test
    void updatePeriod_activeAppointments_throwsConflict() {
        period.setStartDate(LocalDate.now().plusDays(1));
        period.setEndDate(LocalDate.now().plusDays(5));

        LocalDate newStart = LocalDate.now().plusDays(2);
        LocalDate newEnd = LocalDate.now().plusDays(4);
        OutOfOfficePeriodUpdateRequest request = new OutOfOfficePeriodUpdateRequest(
                newStart, newEnd, ReasonCode.LEAVE.name());

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));
        when(outOfOfficePeriodRepository.existsOverlappingPeriodExcludingId(10, newStart, newEnd, 1))
                .thenReturn(false);
        when(appointmentRepository.existsActiveAppointmentsForStaffInDateRange(
                eq(10), eq(newStart), eq(newEnd), eq(ACTIVE_APPOINTMENT_STATUSES)))
                .thenReturn(true);

        assertThatThrownBy(() -> outOfOfficePeriodService.updatePeriod(1, request))
                .isInstanceOf(ConflictException.class)
                .hasMessage(OutOfOfficePeriodMessages.ACTIVE_APPOINTMENTS_UPDATE);

        verify(outOfOfficePeriodRepository, never()).save(any());
    }

    @Test
    void endPeriod_successfulEnd_reevaluatesSlots() {
        LocalDate today = LocalDate.now();
        LocalDate oldStart = today.minusDays(1);
        LocalDate oldEnd = today.plusDays(5);
        period.setStartDate(oldStart);
        period.setEndDate(oldEnd);

        AvailabilitySlot pastSlot = new AvailabilitySlot();
        pastSlot.setSlotId(21);
        pastSlot.setSlotDate(oldStart);
        pastSlot.setIsBlocked(true);

        AvailabilitySlot todaySlot = new AvailabilitySlot();
        todaySlot.setSlotId(22);
        todaySlot.setSlotDate(today);
        todaySlot.setIsBlocked(true);

        AvailabilitySlot futureSlot = new AvailabilitySlot();
        futureSlot.setSlotId(23);
        futureSlot.setSlotDate(today.plusDays(2));
        futureSlot.setIsBlocked(true);

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));
        when(outOfOfficePeriodRepository.save(period)).thenReturn(period);
        when(availabilitySlotRepository.findByStaff_UserIdAndSlotDateBetween(10, oldStart, oldEnd))
                .thenReturn(List.of(pastSlot, todaySlot, futureSlot));
        when(outOfOfficePeriodRepository.existsOtherPeriodCoveringDate(10, today.plusDays(2), 1))
                .thenReturn(false);
        when(outOfOfficePeriodMapper.toResponse(period)).thenReturn(
                OutOfOfficePeriodResponseDto.builder()
                        .outOfOfficeId(1)
                        .startDate(oldStart)
                        .endDate(today)
                        .reasonCode(ReasonCode.LEAVE.name())
                        .build());

        OutOfOfficePeriodResponseDto result = outOfOfficePeriodService.endPeriod(1);

        assertThat(result.getEndDate()).isEqualTo(today);
        verify(outOfOfficePeriodMapper).applyEnd(period, today);
        assertThat(pastSlot.getIsBlocked()).isTrue();
        assertThat(todaySlot.getIsBlocked()).isTrue();
        assertThat(futureSlot.getIsBlocked()).isFalse();
        verify(appointmentRepository, never()).existsActiveAppointmentsForStaffInDateRange(
                any(), any(), any(), any());
    }

    @Test
    void endPeriod_slotCoveredByOtherOoo_remainsBlocked() {
        LocalDate today = LocalDate.now();
        LocalDate oldStart = today.plusDays(1);
        LocalDate oldEnd = today.plusDays(5);
        period.setStartDate(oldStart);
        period.setEndDate(oldEnd);

        AvailabilitySlot futureSlot = new AvailabilitySlot();
        futureSlot.setSlotId(31);
        futureSlot.setSlotDate(today.plusDays(3));
        futureSlot.setIsBlocked(true);

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));
        when(outOfOfficePeriodRepository.save(period)).thenReturn(period);
        when(availabilitySlotRepository.findByStaff_UserIdAndSlotDateBetween(10, oldStart, oldEnd))
                .thenReturn(List.of(futureSlot));
        when(outOfOfficePeriodRepository.existsOtherPeriodCoveringDate(10, today.plusDays(3), 1))
                .thenReturn(true);
        when(outOfOfficePeriodMapper.toResponse(period)).thenReturn(responseDto);

        outOfOfficePeriodService.endPeriod(1);

        assertThat(futureSlot.getIsBlocked()).isTrue();
    }

    @Test
    void endPeriod_otherAcademician_throwsAccessDenied() {
        User other = new User();
        other.setUserId(99);
        period.setStaff(other);
        period.setEndDate(LocalDate.now().plusDays(3));

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));

        assertThatThrownBy(() -> outOfOfficePeriodService.endPeriod(1))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(OutOfOfficePeriodMessages.END_ACCESS_DENIED);

        verify(outOfOfficePeriodRepository, never()).save(any());
    }

    @Test
    void endPeriod_notFound_throwsResourceNotFound() {
        when(outOfOfficePeriodRepository.findByIdWithStaff(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> outOfOfficePeriodService.endPeriod(99))
                .isInstanceOf(com.mars.exception.ResourceNotFoundException.class)
                .hasMessage(OutOfOfficePeriodMessages.PERIOD_NOT_FOUND);
    }

    @Test
    void endPeriod_alreadyEnded_throwsConflict() {
        period.setStartDate(LocalDate.now().minusDays(2));
        period.setEndDate(LocalDate.now());

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));

        assertThatThrownBy(() -> outOfOfficePeriodService.endPeriod(1))
                .isInstanceOf(ConflictException.class)
                .hasMessage(OutOfOfficePeriodMessages.ALREADY_ENDED);

        verify(outOfOfficePeriodRepository, never()).save(any());
    }

    @Test
    void endPeriod_pastCompletedOoo_throwsBadRequest() {
        period.setStartDate(LocalDate.now().minusDays(10));
        period.setEndDate(LocalDate.now().minusDays(1));

        when(outOfOfficePeriodRepository.findByIdWithStaff(1)).thenReturn(Optional.of(period));

        assertThatThrownBy(() -> outOfOfficePeriodService.endPeriod(1))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(OutOfOfficePeriodMessages.PAST_PERIOD_NOT_ENDABLE);

        verify(outOfOfficePeriodRepository, never()).save(any());
    }
}
