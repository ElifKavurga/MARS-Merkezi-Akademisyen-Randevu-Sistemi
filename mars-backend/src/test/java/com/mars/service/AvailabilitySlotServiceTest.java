package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mars.AvailabilitySlotMessages;
import com.mars.dto.AvailabilitySlotBlockRequest;
import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.dto.AvailabilitySlotStatsResponseDto;
import com.mars.dto.AvailabilitySlotUpdateRequest;
import com.mars.dto.RecurrenceRuleCreateRequest;
import com.mars.dto.RecurrenceRuleResponseDto;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.Role;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.enums.OfficeHourType;
import com.mars.enums.RecurrenceEndMode;
import com.mars.enums.RepeatType;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.AvailabilitySlotMapper;
import com.mars.repository.AppointmentRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.security.CustomUserDetails;
import com.mars.util.AcademicTermCalendar;
import com.mars.util.AvailabilityTimeRules;

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

    @Mock
    private RecurrenceRuleService recurrenceRuleService;

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
    void getMyStats_returnsAggregatedCounts() {
        when(availabilitySlotRepository.countByStaff_UserId(10)).thenReturn(8L);
        when(availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(10, true)).thenReturn(3L);
        when(availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(10, false)).thenReturn(5L);
        when(availabilitySlotRepository.countByStaff_UserIdAndSlotDateBetween(
                eq(10), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(2L);
        when(availabilitySlotMapper.toStatsResponse(8L, 5L, 3L, 2L))
                .thenReturn(AvailabilitySlotStatsResponseDto.builder()
                        .totalSlotCount(8)
                        .availableSlotCount(5)
                        .blockedSlotCount(3)
                        .thisWeekSlotCount(2)
                        .build());

        AvailabilitySlotStatsResponseDto result = availabilitySlotService.getMyStats();

        assertThat(result.getTotalSlotCount()).isEqualTo(8);
        assertThat(result.getAvailableSlotCount()).isEqualTo(5);
        assertThat(result.getBlockedSlotCount()).isEqualTo(3);
        assertThat(result.getThisWeekSlotCount()).isEqualTo(2);
    }

    @Test
    void createSlots_oneTime_createsSingleSlotWithoutRecurrence() {
        LocalDate slotDate = LocalDate.now().plusDays(1);
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.ONE_TIME.name(),
                slotDate,
                null,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                null,
                null,
                null);

        when(availabilitySlotRepository.existsOverlappingSlot(
                10, slotDate, LocalTime.of(10, 0), LocalTime.of(12, 0)))
                .thenReturn(false);
        when(availabilitySlotMapper.toEntity(slotDate, LocalTime.of(10, 0), LocalTime.of(12, 0), academician, "FACE_TO_FACE"))
                .thenReturn(slot);
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(availabilitySlotMapper.toResponse(slot)).thenReturn(responseDto);

        List<AvailabilitySlotResponseDto> result = availabilitySlotService.createSlots(request);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSlotId()).isEqualTo(1);
        verify(recurrenceRuleService, never()).createRule(any(), any());
        verify(availabilitySlotMapper).toEntity(
                slotDate,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                academician,
                MeetingType.FACE_TO_FACE.name());
    }

    @ParameterizedTest
    @ValueSource(strings = {"FACE_TO_FACE", "ONLINE", "BOTH"})
    void createSlots_supportedMeetingType_isPersisted(String meetingType) {
        LocalDate slotDate = LocalDate.now().plusDays(1);
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.ONE_TIME.name(),
                slotDate,
                null,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                null,
                null,
                meetingType);

        AvailabilitySlot meetingTypeSlot = new AvailabilitySlot();
        meetingTypeSlot.setSlotId(5);
        when(availabilitySlotRepository.existsOverlappingSlot(
                10, slotDate, LocalTime.of(10, 0), LocalTime.of(12, 0)))
                .thenReturn(false);
        when(availabilitySlotMapper.toEntity(
                slotDate, LocalTime.of(10, 0), LocalTime.of(12, 0), academician, meetingType))
                .thenReturn(meetingTypeSlot);
        when(availabilitySlotRepository.save(meetingTypeSlot)).thenReturn(meetingTypeSlot);
        when(availabilitySlotMapper.toResponse(meetingTypeSlot)).thenReturn(
                AvailabilitySlotResponseDto.builder()
                        .slotId(5)
                        .meetingType(meetingType)
                        .build());

        List<AvailabilitySlotResponseDto> result = availabilitySlotService.createSlots(request);

        assertThat(result).singleElement()
                .extracting(AvailabilitySlotResponseDto::getMeetingType)
                .isEqualTo(meetingType);
    }

    @Test
    void createSlots_recurringMultipleDays_createsSeparateSlotsWithRules() {
        LocalDate wed = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.WEDNESDAY));
        LocalDate thu = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.THURSDAY));
        LocalDate termEnd = AcademicTermCalendar.resolveCurrentTermEndDate(LocalDate.now());
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.RECURRING.name(),
                null,
                List.of(DayOfWeek.WEDNESDAY.getValue(), DayOfWeek.THURSDAY.getValue()),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                RecurrenceEndMode.TERM_END.name(),
                null,
                null);

        AvailabilitySlot wedSlot = new AvailabilitySlot();
        wedSlot.setSlotId(1);
        wedSlot.setStaff(academician);
        AvailabilitySlot thuSlot = new AvailabilitySlot();
        thuSlot.setSlotId(2);
        thuSlot.setStaff(academician);

        when(availabilitySlotRepository.existsOverlappingSlot(eq(10), any(LocalDate.class), any(), any()))
                .thenReturn(false);
        when(availabilitySlotMapper.toEntity(wed, LocalTime.of(10, 0), LocalTime.of(11, 0), academician, "FACE_TO_FACE"))
                .thenReturn(wedSlot);
        when(availabilitySlotMapper.toEntity(thu, LocalTime.of(10, 0), LocalTime.of(11, 0), academician, "FACE_TO_FACE"))
                .thenReturn(thuSlot);
        when(availabilitySlotRepository.save(wedSlot)).thenReturn(wedSlot);
        when(availabilitySlotRepository.save(thuSlot)).thenReturn(thuSlot);
        when(recurrenceRuleService.createRule(any(), any(RecurrenceRuleCreateRequest.class)))
                .thenReturn(RecurrenceRuleResponseDto.builder().recurrenceRuleId(9).build());
        when(availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(1)).thenReturn(Optional.of(wedSlot));
        when(availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(2)).thenReturn(Optional.of(thuSlot));
        when(availabilitySlotMapper.toResponse(wedSlot)).thenReturn(
                AvailabilitySlotResponseDto.builder().slotId(1).slotDate(wed).isBlocked(false).build());
        when(availabilitySlotMapper.toResponse(thuSlot)).thenReturn(
                AvailabilitySlotResponseDto.builder().slotId(2).slotDate(thu).isBlocked(false).build());

        List<AvailabilitySlotResponseDto> result = availabilitySlotService.createSlots(request);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(AvailabilitySlotResponseDto::getSlotId).containsExactly(1, 2);
        verify(availabilitySlotRepository, org.mockito.Mockito.times(2)).save(any());
        verify(recurrenceRuleService, org.mockito.Mockito.times(2)).createRule(any(), any());
        assertThat(termEnd).isNotNull();
    }

    @Test
    void createSlots_weeklyUntilDate_createsRecurrenceRuleWithRepeatCountOne() {
        LocalDate slotDate = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        LocalDate endDate = slotDate.plusWeeks(4);
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.RECURRING.name(),
                null,
                List.of(DayOfWeek.MONDAY.getValue()),
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                RecurrenceEndMode.UNTIL_DATE.name(),
                endDate,
                null);

        when(availabilitySlotRepository.existsOverlappingSlot(
                10, slotDate, LocalTime.of(10, 0), LocalTime.of(12, 0)))
                .thenReturn(false);
        when(availabilitySlotMapper.toEntity(slotDate, LocalTime.of(10, 0), LocalTime.of(12, 0), academician, "FACE_TO_FACE"))
                .thenReturn(slot);
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(recurrenceRuleService.createRule(eq(1), any(RecurrenceRuleCreateRequest.class)))
                .thenReturn(RecurrenceRuleResponseDto.builder()
                        .recurrenceRuleId(9)
                        .repeatType(RepeatType.WEEKLY.name())
                        .repeatCount(1)
                        .startDate(slotDate)
                        .endDate(endDate)
                        .build());
        when(availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(1)).thenReturn(Optional.of(slot));
        when(availabilitySlotMapper.toResponse(slot)).thenReturn(responseDto);

        availabilitySlotService.createSlots(request);

        ArgumentCaptor<RecurrenceRuleCreateRequest> captor =
                ArgumentCaptor.forClass(RecurrenceRuleCreateRequest.class);
        verify(recurrenceRuleService).createRule(eq(1), captor.capture());
        assertThat(captor.getValue().getRepeatType()).isEqualTo(RepeatType.WEEKLY.name());
        assertThat(captor.getValue().getStartDate()).isEqualTo(slotDate);
        assertThat(captor.getValue().getEndDate()).isEqualTo(endDate);
        assertThat(captor.getValue().getRepeatCount()).isEqualTo(AvailabilityTimeRules.WEEKLY_REPEAT_COUNT);
    }

    @Test
    void createSlots_weeklyUntilTermEnd_usesTermEndDate() {
        LocalDate slotDate = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY));
        LocalDate termEnd = AcademicTermCalendar.resolveCurrentTermEndDate(LocalDate.now());
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.RECURRING.name(),
                null,
                List.of(DayOfWeek.FRIDAY.getValue()),
                LocalTime.of(14, 0),
                LocalTime.of(15, 0),
                RecurrenceEndMode.TERM_END.name(),
                null,
                null);

        when(availabilitySlotRepository.existsOverlappingSlot(
                10, slotDate, LocalTime.of(14, 0), LocalTime.of(15, 0)))
                .thenReturn(false);
        when(availabilitySlotMapper.toEntity(slotDate, LocalTime.of(14, 0), LocalTime.of(15, 0), academician, "FACE_TO_FACE"))
                .thenReturn(slot);
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(recurrenceRuleService.createRule(eq(1), any(RecurrenceRuleCreateRequest.class)))
                .thenReturn(RecurrenceRuleResponseDto.builder().recurrenceRuleId(3).build());
        when(availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(1)).thenReturn(Optional.of(slot));
        when(availabilitySlotMapper.toResponse(slot)).thenReturn(responseDto);

        availabilitySlotService.createSlots(request);

        ArgumentCaptor<RecurrenceRuleCreateRequest> captor =
                ArgumentCaptor.forClass(RecurrenceRuleCreateRequest.class);
        verify(recurrenceRuleService).createRule(eq(1), captor.capture());
        assertThat(captor.getValue().getEndDate()).isEqualTo(termEnd);
        assertThat(captor.getValue().getRepeatCount()).isEqualTo(1);
    }

    @Test
    void createSlots_invalidMinuteStep_throwsBadRequest() {
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.ONE_TIME.name(),
                LocalDate.now().plusDays(1),
                null,
                LocalTime.of(10, 5),
                LocalTime.of(12, 0),
                null,
                null,
                null);

        assertThatThrownBy(() -> availabilitySlotService.createSlots(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage(AvailabilitySlotMessages.INVALID_MINUTE_STEP);

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void createSlots_overlappingSlot_throwsConflict() {
        LocalDate slotDate = LocalDate.now().plusDays(2);
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.ONE_TIME.name(),
                slotDate,
                null,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                null,
                null,
                null);

        when(availabilitySlotRepository.existsOverlappingSlot(
                10, slotDate, LocalTime.of(10, 0), LocalTime.of(12, 0)))
                .thenReturn(true);

        assertThatThrownBy(() -> availabilitySlotService.createSlots(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("çakışan");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void createSlots_startAfterEnd_throwsBadRequest() {
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.ONE_TIME.name(),
                LocalDate.now().plusDays(1),
                null,
                LocalTime.of(12, 0),
                LocalTime.of(10, 0),
                null,
                null,
                null);

        assertThatThrownBy(() -> availabilitySlotService.createSlots(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Başlangıç saati");

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void createSlots_withoutAuthentication_throwsAccessDenied() {
        SecurityContextHolder.clearContext();
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                OfficeHourType.ONE_TIME.name(),
                LocalDate.now().plusDays(1),
                null,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                null,
                null,
                null);

        assertThatThrownBy(() -> availabilitySlotService.createSlots(request))
                .isInstanceOf(AccessDeniedException.class);

        verify(availabilitySlotRepository, never()).save(any());
    }

    @Test
    void availabilityTimeRules_computesAppointmentSlotCount() {
        assertThat(AvailabilityTimeRules.computeTotalDurationMinutes(
                LocalTime.of(10, 0), LocalTime.of(12, 0))).isEqualTo(120);
        assertThat(AvailabilityTimeRules.computeAppointmentSlotCount(
                LocalTime.of(10, 0), LocalTime.of(12, 0))).isEqualTo(12);
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

    @ParameterizedTest
    @ValueSource(strings = {"ASSISTANT", "ACADEMICIAN"})
    void updateSlot_otherStaffSlot_throwsAccessDenied(String ownerRoleName) {
        Role assistantRole = new Role();
        assistantRole.setRoleName(RoleType.ASSISTANT.name());
        academician.setRole(assistantRole);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new CustomUserDetails(academician), null, List.of()));

        User other = new User();
        other.setUserId(99);
        Role ownerRole = new Role();
        ownerRole.setRoleName(ownerRoleName);
        other.setRole(ownerRole);
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
