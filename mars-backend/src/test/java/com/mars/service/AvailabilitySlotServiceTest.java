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

import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.User;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.mapper.AvailabilitySlotMapper;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class AvailabilitySlotServiceTest {

    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;

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
}
