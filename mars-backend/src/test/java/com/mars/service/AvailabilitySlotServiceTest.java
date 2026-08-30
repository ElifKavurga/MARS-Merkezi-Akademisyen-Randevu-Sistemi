package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.RecurrenceRuleCreateRequest;
import com.mars.dto.RecurrenceRuleResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.RecurrenceRule;
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
import com.mars.repository.AppointmentRescheduleRequestRepository;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.DelegationLogRepository;
import com.mars.repository.WaitlistEntryRepository;
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
    private AppointmentRescheduleRequestRepository appointmentRescheduleRequestRepository;

    @Mock
    private DelegationLogRepository delegationLogRepository;

    @Mock
    private AvailabilitySlotMapper availabilitySlotMapper;

    @Mock
    private RecurrenceRuleService recurrenceRuleService;

    @Mock
    private com.mars.repository.OutOfOfficePeriodRepository outOfOfficePeriodRepository;

    @Mock
    private WaitlistEntryRepository waitlistEntryRepository;

    @Mock
    private WaitlistService waitlistService;

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
        LocalDate referenceDate = LocalDate.now();
        LocalDate wed = referenceDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.WEDNESDAY));
        LocalDate thu = referenceDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.THURSDAY));
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
        LocalDate referenceDate = LocalDate.now();
        LocalDate slotDate = referenceDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY));
        LocalDate termEnd = AcademicTermCalendar.resolveCurrentTermEndDate(slotDate);
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

    @Test
    void getAvailableSlotsForStaff_nullStaffId_throwsBadRequest() {
        assertThatThrownBy(() -> availabilitySlotService.getAvailableSlotsForStaff(null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Akademisyen seçimi zorunludur.");
    }

    @Test
    void getAvailableSlotsForStaff_excludesSlotsWithinBookingNotice_br017() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Europe/Istanbul"));
        LocalDate today = now.toLocalDate();

        LocalDateTime withinStart = now.plusMinutes(10);
        AvailabilitySlot withinNotice = new AvailabilitySlot();
        withinNotice.setSlotId(21);
        withinNotice.setStaff(academician);
        withinNotice.setSlotDate(withinStart.toLocalDate());
        withinNotice.setStartTime(withinStart.toLocalTime().withSecond(0).withNano(0));
        withinNotice.setEndTime(withinStart.plusMinutes(30).toLocalTime().withSecond(0).withNano(0));
        withinNotice.setIsBlocked(false);
        withinNotice.setMeetingType(MeetingType.FACE_TO_FACE.name());

        // Keep the valid slot away from midnight so its LocalTime end never wraps
        // to the next day and makes the fixture look like a past slot.
        LocalDateTime afterNoticeStart = now.toLocalDate().plusDays(2).atTime(10, 0);
        AvailabilitySlot afterNotice = new AvailabilitySlot();
        afterNotice.setSlotId(22);
        afterNotice.setStaff(academician);
        afterNotice.setSlotDate(afterNoticeStart.toLocalDate());
        afterNotice.setStartTime(afterNoticeStart.toLocalTime().withSecond(0).withNano(0));
        afterNotice.setEndTime(afterNoticeStart.plusMinutes(30).toLocalTime().withSecond(0).withNano(0));
        afterNotice.setIsBlocked(false);
        afterNotice.setMeetingType(MeetingType.FACE_TO_FACE.name());

        AvailableSlotResponseDto mapped = AvailableSlotResponseDto.builder()
                .slotId(22)
                .staffId(10)
                .slotDate(afterNotice.getSlotDate())
                .startTime(afterNotice.getStartTime())
                .endTime(afterNotice.getEndTime())
                .meetingType(MeetingType.FACE_TO_FACE.name())
                .build();

        when(availabilitySlotRepository.findAvailableSlotsForStaff(
                        eq(10), eq(today), eq(ACTIVE_APPOINTMENT_STATUSES)))
                .thenReturn(List.of(withinNotice, afterNotice));
        when(availabilitySlotMapper.toAvailableResponse(afterNotice)).thenReturn(mapped);

        List<AvailableSlotResponseDto> result = availabilitySlotService.getAvailableSlotsForStaff(10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSlotId()).isEqualTo(22);
        verify(availabilitySlotMapper).toAvailableResponse(afterNotice);
        verify(availabilitySlotMapper, never()).toAvailableResponse(withinNotice);
    }

    @Test
    void getAvailableSlotsForStaff_excludesPastSlots() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Europe/Istanbul"));
        LocalDate today = now.toLocalDate();

        LocalTime pastStart = LocalTime.of(10, 0);
        AvailabilitySlot past = new AvailabilitySlot();
        past.setSlotId(31);
        past.setStaff(academician);
        past.setSlotDate(today.minusDays(1));
        past.setStartTime(pastStart);
        past.setEndTime(pastStart.plusMinutes(30));
        past.setIsBlocked(false);
        past.setMeetingType(MeetingType.FACE_TO_FACE.name());

        LocalDateTime futureStart = today.plusDays(2).atTime(10, 0);
        AvailabilitySlot future = new AvailabilitySlot();
        future.setSlotId(32);
        future.setStaff(academician);
        future.setSlotDate(futureStart.toLocalDate());
        future.setStartTime(futureStart.toLocalTime().withSecond(0).withNano(0));
        future.setEndTime(futureStart.plusMinutes(30).toLocalTime().withSecond(0).withNano(0));
        future.setIsBlocked(false);
        future.setMeetingType(MeetingType.ONLINE.name());

        AvailableSlotResponseDto mapped = AvailableSlotResponseDto.builder()
                .slotId(32)
                .staffId(10)
                .slotDate(future.getSlotDate())
                .startTime(future.getStartTime())
                .endTime(future.getEndTime())
                .meetingType(MeetingType.ONLINE.name())
                .build();

        when(availabilitySlotRepository.findAvailableSlotsForStaff(
                        eq(10), eq(today), eq(ACTIVE_APPOINTMENT_STATUSES)))
                .thenReturn(List.of(past, future));
        when(availabilitySlotMapper.toAvailableResponse(future)).thenReturn(mapped);

        List<AvailableSlotResponseDto> result = availabilitySlotService.getAvailableSlotsForStaff(10);

        assertThat(result).extracting(AvailableSlotResponseDto::getSlotId).containsExactly(32);
        verify(availabilitySlotMapper, never()).toAvailableResponse(past);
    }

    @Test
    void getAvailableSlotsForStaff_usesRepositoryFilterForBlockedAndBookedSlots() {
        LocalDate today = LocalDate.now();
        when(availabilitySlotRepository.findAvailableSlotsForStaff(
                        eq(10), eq(today), eq(ACTIVE_APPOINTMENT_STATUSES)))
                .thenReturn(List.of());

        List<AvailableSlotResponseDto> result = availabilitySlotService.getAvailableSlotsForStaff(10);

        assertThat(result).isEmpty();
        verify(availabilitySlotRepository).findAvailableSlotsForStaff(
                10, today, ACTIVE_APPOINTMENT_STATUSES);
    }

    @Test
    void getBookableAvailableSlotsForStaff_splitsAvailabilityByDurationMinutes() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Europe/Istanbul"));
        LocalDate today = now.toLocalDate();
        LocalDate rangeEnd = AcademicTermCalendar.resolveBookableHorizonEnd(today);
        LocalDate slotDate = now.plusDays(1).toLocalDate();

        AvailabilitySlot officeHour = new AvailabilitySlot();
        officeHour.setSlotId(41);
        officeHour.setStaff(academician);
        officeHour.setSlotDate(slotDate);
        officeHour.setStartTime(LocalTime.of(10, 0));
        officeHour.setEndTime(LocalTime.of(11, 0));
        officeHour.setIsBlocked(false);
        officeHour.setMeetingType(MeetingType.ONLINE.name());

        AvailableSlotResponseDto first = AvailableSlotResponseDto.builder()
                .slotId(41)
                .staffId(10)
                .slotDate(slotDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .meetingType(MeetingType.ONLINE.name())
                .build();
        AvailableSlotResponseDto second = AvailableSlotResponseDto.builder()
                .slotId(41)
                .staffId(10)
                .slotDate(slotDate)
                .startTime(LocalTime.of(10, 30))
                .endTime(LocalTime.of(11, 0))
                .meetingType(MeetingType.ONLINE.name())
                .build();

        when(availabilitySlotRepository.countByStaff_UserId(10)).thenReturn(1L);
        when(availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(10, false)).thenReturn(1L);
        when(availabilitySlotRepository.findBookableSlotTemplatesForStaff(eq(10), eq(today), anyCollection()))
                .thenReturn(List.of(officeHour));
        when(appointmentRepository.findActiveAppointmentsForStaffInDateRange(
                        10, today, rangeEnd, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(List.of());
        when(outOfOfficePeriodRepository.existsOverlappingPeriod(10, slotDate, slotDate))
                .thenReturn(false);
        when(availabilitySlotMapper.toAvailableResponse(
                        officeHour, slotDate, LocalTime.of(10, 0), LocalTime.of(10, 30)))
                .thenReturn(first);
        when(availabilitySlotMapper.toAvailableResponse(
                        officeHour, slotDate, LocalTime.of(10, 30), LocalTime.of(11, 0)))
                .thenReturn(second);

        List<AvailableSlotResponseDto> result =
                availabilitySlotService.getBookableAvailableSlotsForStaff(10, 30);

        assertThat(result).containsExactly(first, second);
    }

    @Test
    void getBookableAvailableSlotsForStaff_excludesSlotLockedByPendingDelegation() {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Europe/Istanbul"));
        LocalDate rangeEnd = AcademicTermCalendar.resolveBookableHorizonEnd(today);
        LocalDate slotDate = today.plusDays(2);
        AvailabilitySlot locked = oneTimeSlot(42, slotDate, LocalTime.of(10, 0), false);

        when(availabilitySlotRepository.countByStaff_UserId(10)).thenReturn(1L);
        when(availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(10, false)).thenReturn(1L);
        when(availabilitySlotRepository.findBookableSlotTemplatesForStaff(eq(10), eq(today), anyCollection()))
                .thenReturn(List.of(locked));
        when(appointmentRepository.findActiveAppointmentsForStaffInDateRange(
                        10, today, rangeEnd, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(List.of());
        when(outOfOfficePeriodRepository.existsOverlappingPeriod(10, slotDate, slotDate))
                .thenReturn(false);
        when(delegationLogRepository.existsActiveSlotLock(
                        eq(10),
                        eq(slotDate),
                        eq(LocalTime.of(10, 0)),
                        eq(LocalTime.of(10, 30)),
                        any(LocalDateTime.class),
                        eq(null)))
                .thenReturn(true);

        List<AvailableSlotResponseDto> result =
                availabilitySlotService.getBookableAvailableSlotsForStaff(10, 30);

        assertThat(result).isEmpty();
        verify(availabilitySlotMapper, never())
                .toAvailableResponse(any(AvailabilitySlot.class), any(), any(), any());
    }

    @Test
    void getBookableAvailableSlotsForStaff_excludesBlockedOooWithinNoticeAndOverlappingAppointment() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Europe/Istanbul"));
        LocalDate today = now.toLocalDate();
        LocalDate rangeEnd = AcademicTermCalendar.resolveBookableHorizonEnd(today);

        AvailabilitySlot blocked = oneTimeSlot(51, now.plusDays(1).toLocalDate(), LocalTime.of(10, 0), true);
        blocked.setEndTime(LocalTime.of(10, 30));
        AvailabilitySlot ooo = oneTimeSlot(53, now.plusDays(2).toLocalDate(), LocalTime.of(10, 0), false);
        ooo.setEndTime(LocalTime.of(10, 30));
        LocalDateTime withinStart = now.plusMinutes(10);
        AvailabilitySlot withinNotice = oneTimeSlot(
                54,
                withinStart.toLocalDate(),
                withinStart.toLocalTime().withSecond(0).withNano(0),
                false);
        withinNotice.setEndTime(withinNotice.getStartTime().plusMinutes(30));

        AvailabilitySlot bookedParent = oneTimeSlot(52, now.plusDays(1).toLocalDate(), LocalTime.of(11, 0), false);
        bookedParent.setEndTime(LocalTime.of(11, 30));
        Appointment overlapping = new Appointment();
        overlapping.setSlot(bookedParent);

        when(availabilitySlotRepository.countByStaff_UserId(10)).thenReturn(4L);
        when(availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(10, false)).thenReturn(3L);
        when(availabilitySlotRepository.findBookableSlotTemplatesForStaff(eq(10), eq(today), anyCollection()))
                .thenReturn(List.of(blocked, bookedParent, ooo, withinNotice));
        when(appointmentRepository.findActiveAppointmentsForStaffInDateRange(
                        10, today, rangeEnd, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(List.of(overlapping));
        when(outOfOfficePeriodRepository.existsOverlappingPeriod(10, ooo.getSlotDate(), ooo.getSlotDate()))
                .thenReturn(true);
        when(outOfOfficePeriodRepository.existsOverlappingPeriod(
                        eq(10), eq(blocked.getSlotDate()), eq(blocked.getSlotDate())))
                .thenReturn(false);

        List<AvailableSlotResponseDto> result =
                availabilitySlotService.getBookableAvailableSlotsForStaff(10, 30);

        assertThat(result).isEmpty();
        verify(availabilitySlotMapper, never())
                .toAvailableResponse(any(AvailabilitySlot.class), any(), any(), any());
    }

    @Test
    void getBookableAvailableSlotsForStaff_expandsWeeklyRecurrenceThenSplitsAndSorts() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Europe/Istanbul"));
        LocalDate today = now.toLocalDate();
        LocalDate rangeEnd = AcademicTermCalendar.resolveBookableHorizonEnd(today);
        LocalDate firstOccurrence = today.with(TemporalAdjusters.next(DayOfWeek.WEDNESDAY));
        if (firstOccurrence.isAfter(rangeEnd)) {
            return;
        }
        LocalDate recurrenceEnd = firstOccurrence.plusWeeks(1);
        if (recurrenceEnd.isAfter(rangeEnd)) {
            recurrenceEnd = rangeEnd;
        }

        RecurrenceRule rule = new RecurrenceRule();
        rule.setRecurrenceRuleId(1);
        rule.setRepeatType(RepeatType.WEEKLY.name());
        rule.setStartDate(today);
        rule.setEndDate(recurrenceEnd);

        AvailabilitySlot recurring = new AvailabilitySlot();
        recurring.setSlotId(61);
        recurring.setStaff(academician);
        recurring.setSlotDate(firstOccurrence);
        recurring.setStartTime(LocalTime.of(13, 0));
        recurring.setEndTime(LocalTime.of(14, 0));
        recurring.setIsBlocked(false);
        recurring.setMeetingType(MeetingType.FACE_TO_FACE.name());
        recurring.setRecurrenceRule(rule);

        when(availabilitySlotRepository.countByStaff_UserId(10)).thenReturn(1L);
        when(availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(10, false)).thenReturn(1L);
        when(availabilitySlotRepository.findBookableSlotTemplatesForStaff(eq(10), eq(today), anyCollection()))
                .thenReturn(List.of(recurring));
        when(appointmentRepository.findActiveAppointmentsForStaffInDateRange(
                        10, today, rangeEnd, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(List.of());
        when(outOfOfficePeriodRepository.existsOverlappingPeriod(eq(10), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(false);
        when(availabilitySlotMapper.toAvailableResponse(
                        eq(recurring), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenAnswer(invocation -> AvailableSlotResponseDto.builder()
                        .slotId(61)
                        .slotDate(invocation.getArgument(1))
                        .startTime(invocation.getArgument(2))
                        .endTime(invocation.getArgument(3))
                        .meetingType(MeetingType.FACE_TO_FACE.name())
                        .build());

        List<AvailableSlotResponseDto> result =
                availabilitySlotService.getBookableAvailableSlotsForStaff(10, 30);

        assertThat(result).isNotEmpty();
        assertThat(result.get(0).getSlotDate()).isEqualTo(firstOccurrence);
        assertThat(result.get(0).getStartTime()).isEqualTo(LocalTime.of(13, 0));
        assertThat(result.get(0).getEndTime()).isEqualTo(LocalTime.of(13, 30));
        for (int i = 1; i < result.size(); i++) {
            AvailableSlotResponseDto previous = result.get(i - 1);
            AvailableSlotResponseDto current = result.get(i);
            if (previous.getSlotDate().equals(current.getSlotDate())) {
                assertThat(current.getStartTime()).isAfterOrEqualTo(previous.getStartTime());
            } else {
                assertThat(current.getSlotDate()).isAfter(previous.getSlotDate());
            }
        }
    }

    @Test
    void getBookableAvailableSlotsForStaff_appointmentOnAnchorDate_doesNotWipeLaterOccurrences() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Europe/Istanbul"));
        LocalDate today = now.toLocalDate();
        LocalDate rangeEnd = AcademicTermCalendar.resolveBookableHorizonEnd(today);
        LocalDate firstOccurrence = today.with(TemporalAdjusters.next(DayOfWeek.WEDNESDAY));
        if (firstOccurrence.isAfter(rangeEnd)) {
            return;
        }
        LocalDate secondOccurrence = firstOccurrence.plusWeeks(1);
        if (secondOccurrence.isAfter(rangeEnd)) {
            return;
        }

        RecurrenceRule rule = new RecurrenceRule();
        rule.setRecurrenceRuleId(9);
        rule.setRepeatType(RepeatType.WEEKLY.name());
        rule.setStartDate(today);
        rule.setEndDate(rangeEnd);

        AvailabilitySlot recurring = new AvailabilitySlot();
        recurring.setSlotId(70);
        recurring.setStaff(academician);
        recurring.setSlotDate(firstOccurrence);
        recurring.setStartTime(LocalTime.of(10, 0));
        recurring.setEndTime(LocalTime.of(11, 0));
        recurring.setIsBlocked(false);
        recurring.setMeetingType(MeetingType.FACE_TO_FACE.name());
        recurring.setRecurrenceRule(rule);

        Appointment bookedAnchor = new Appointment();
        AvailabilitySlot bookedSlotView = new AvailabilitySlot();
        bookedSlotView.setSlotId(70);
        bookedSlotView.setSlotDate(firstOccurrence);
        bookedSlotView.setStartTime(LocalTime.of(10, 0));
        bookedSlotView.setEndTime(LocalTime.of(11, 0));
        bookedAnchor.setSlot(bookedSlotView);

        when(availabilitySlotRepository.countByStaff_UserId(10)).thenReturn(1L);
        when(availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(10, false)).thenReturn(1L);
        when(availabilitySlotRepository.findBookableSlotTemplatesForStaff(eq(10), eq(today), anyCollection()))
                .thenReturn(List.of(recurring));
        when(appointmentRepository.findActiveAppointmentsForStaffInDateRange(
                        10, today, rangeEnd, ACTIVE_APPOINTMENT_STATUSES))
                .thenReturn(List.of(bookedAnchor));
        when(outOfOfficePeriodRepository.existsOverlappingPeriod(eq(10), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(false);
        when(availabilitySlotMapper.toAvailableResponse(
                        eq(recurring), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenAnswer(invocation -> AvailableSlotResponseDto.builder()
                        .slotId(70)
                        .slotDate(invocation.getArgument(1))
                        .startTime(invocation.getArgument(2))
                        .endTime(invocation.getArgument(3))
                        .meetingType(MeetingType.FACE_TO_FACE.name())
                        .build());

        List<AvailableSlotResponseDto> result =
                availabilitySlotService.getBookableAvailableSlotsForStaff(10, 30);

        assertThat(result).isNotEmpty();
        assertThat(result)
                .extracting(AvailableSlotResponseDto::getSlotDate)
                .doesNotContain(firstOccurrence);
        assertThat(result)
                .extracting(AvailableSlotResponseDto::getSlotDate)
                .contains(secondOccurrence);
    }

    @Test
    void getBookableAvailableSlotsForStaff_oooInsideShortWindow_keepsLaterOccurrencesBeyond14Days() {
        // Regresyon: today+14 sert kesimi, OOO (17–30 Tem) sonrası Perşembe (6 Ağu+) slotları eliyordu.
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Europe/Istanbul"));
        LocalDate rangeEnd = AcademicTermCalendar.resolveBookableHorizonEnd(today);
        LocalDate firstThursday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.THURSDAY));
        LocalDate oooStart = firstThursday;
        LocalDate oooEnd = firstThursday.plusDays(13);
        LocalDate afterOooThursday = firstThursday.plusWeeks(1);
        while (!afterOooThursday.isAfter(oooEnd) || !afterOooThursday.isAfter(today.plusDays(14))) {
            afterOooThursday = afterOooThursday.plusWeeks(1);
        }
        if (afterOooThursday.isAfter(rangeEnd)) {
            return;
        }

        RecurrenceRule rule = new RecurrenceRule();
        rule.setRecurrenceRuleId(35);
        rule.setRepeatType(RepeatType.WEEKLY.name());
        rule.setStartDate(firstThursday);
        rule.setEndDate(rangeEnd);

        AvailabilitySlot recurring = new AvailabilitySlot();
        recurring.setSlotId(38);
        recurring.setStaff(academician);
        recurring.setSlotDate(firstThursday);
        recurring.setStartTime(LocalTime.of(8, 30));
        recurring.setEndTime(LocalTime.of(17, 0));
        recurring.setIsBlocked(false);
        recurring.setMeetingType(MeetingType.FACE_TO_FACE.name());
        recurring.setRecurrenceRule(rule);

        when(availabilitySlotRepository.countByStaff_UserId(10)).thenReturn(1L);
        when(availabilitySlotRepository.countByStaff_UserIdAndIsBlocked(10, false)).thenReturn(1L);
        when(availabilitySlotRepository.findBookableSlotTemplatesForStaff(eq(10), any(LocalDate.class), anyCollection()))
                .thenReturn(List.of(recurring));
        when(appointmentRepository.findActiveAppointmentsForStaffInDateRange(
                        eq(10), any(LocalDate.class), any(LocalDate.class), eq(ACTIVE_APPOINTMENT_STATUSES)))
                .thenReturn(List.of());
        when(outOfOfficePeriodRepository.existsOverlappingPeriod(eq(10), any(LocalDate.class), any(LocalDate.class)))
                .thenAnswer(invocation -> {
                    LocalDate date = invocation.getArgument(1);
                    return !date.isBefore(oooStart) && !date.isAfter(oooEnd);
                });
        when(availabilitySlotMapper.toAvailableResponse(
                        eq(recurring), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenAnswer(invocation -> AvailableSlotResponseDto.builder()
                        .slotId(38)
                        .slotDate(invocation.getArgument(1))
                        .startTime(invocation.getArgument(2))
                        .endTime(invocation.getArgument(3))
                        .meetingType(MeetingType.FACE_TO_FACE.name())
                        .build());

        List<AvailableSlotResponseDto> result =
                availabilitySlotService.getBookableAvailableSlotsForStaff(10, 30);

        assertThat(result).isNotEmpty();
        assertThat(result)
                .extracting(AvailableSlotResponseDto::getSlotDate)
                .contains(afterOooThursday);
        if (!firstThursday.isBefore(today)) {
            assertThat(result)
                    .extracting(AvailableSlotResponseDto::getSlotDate)
                    .doesNotContain(firstThursday);
        }
        assertThat(afterOooThursday.isAfter(today.plusDays(14))).isTrue();
    }

    private static AvailabilitySlot oneTimeSlot(
            int slotId, LocalDate date, LocalTime start, boolean blocked) {
        AvailabilitySlot item = new AvailabilitySlot();
        item.setSlotId(slotId);
        User staff = new User();
        staff.setUserId(10);
        item.setStaff(staff);
        item.setSlotDate(date);
        item.setStartTime(start);
        item.setEndTime(start.plusMinutes(30));
        item.setIsBlocked(blocked);
        item.setMeetingType(MeetingType.FACE_TO_FACE.name());
        return item;
    }
}
