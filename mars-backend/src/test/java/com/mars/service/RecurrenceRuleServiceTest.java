package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

import com.mars.dto.RecurrenceRuleCreateRequest;
import com.mars.dto.RecurrenceRuleResponseDto;
import com.mars.dto.RecurrenceRuleUpdateRequest;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.RecurrenceRule;
import com.mars.entity.User;
import com.mars.enums.RepeatType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.RecurrenceRuleMapper;
import com.mars.repository.AvailabilitySlotRepository;
import com.mars.repository.RecurrenceRuleRepository;
import com.mars.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class RecurrenceRuleServiceTest {

    @Mock
    private RecurrenceRuleRepository recurrenceRuleRepository;

    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;

    @Mock
    private RecurrenceRuleMapper recurrenceRuleMapper;

    @InjectMocks
    private RecurrenceRuleService recurrenceRuleService;

    private User academician;
    private AvailabilitySlot slot;
    private RecurrenceRuleCreateRequest createRequest;
    private RecurrenceRule rule;
    private RecurrenceRuleResponseDto responseDto;

    @BeforeEach
    void setUp() {
        academician = new User();
        academician.setUserId(10);

        slot = new AvailabilitySlot();
        slot.setSlotId(1);
        slot.setStaff(academician);
        slot.setRecurrenceRule(null);

        createRequest = new RecurrenceRuleCreateRequest(
                RepeatType.WEEKLY.name(),
                8,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusWeeks(8));

        rule = new RecurrenceRule();
        rule.setRecurrenceRuleId(5);
        rule.setStaff(academician);
        rule.setRepeatType(RepeatType.WEEKLY.name());
        rule.setRepeatCount(8);
        rule.setStartDate(LocalDate.now().plusDays(1));
        rule.setEndDate(LocalDate.now().plusWeeks(8));

        responseDto = RecurrenceRuleResponseDto.builder()
                .recurrenceRuleId(5)
                .repeatType(RepeatType.WEEKLY.name())
                .repeatCount(8)
                .startDate(rule.getStartDate())
                .endDate(rule.getEndDate())
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
    void createRule_successfulWeeklyCreation() {
        when(availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(1))
                .thenReturn(Optional.of(slot));
        when(recurrenceRuleMapper.toEntity(createRequest, academician)).thenReturn(rule);
        when(recurrenceRuleRepository.save(rule)).thenReturn(rule);
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(recurrenceRuleMapper.toResponse(rule)).thenReturn(responseDto);

        RecurrenceRuleResponseDto result = recurrenceRuleService.createRule(1, createRequest);

        assertThat(result.getRecurrenceRuleId()).isEqualTo(5);
        assertThat(slot.getRecurrenceRule()).isEqualTo(rule);
        verify(recurrenceRuleRepository).save(rule);
    }

    @Test
    void createRule_sameSlotSecondTime_throwsConflict() {
        slot.setRecurrenceRule(rule);
        when(availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(1))
                .thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> recurrenceRuleService.createRule(1, createRequest))
                .isInstanceOf(ConflictException.class);

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void updateRule_successfulUpdate() {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.now().plusDays(2),
                LocalDate.now().plusWeeks(10));

        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));
        when(recurrenceRuleRepository.save(rule)).thenReturn(rule);
        when(recurrenceRuleMapper.toResponse(rule)).thenReturn(responseDto);

        RecurrenceRuleResponseDto result = recurrenceRuleService.updateRule(5, request);

        assertThat(result.getRecurrenceRuleId()).isEqualTo(5);
        verify(recurrenceRuleMapper).updateEntity(rule, request);
        verify(recurrenceRuleRepository).save(rule);
    }

    @Test
    void updateRule_invalidDateRange_throwsBadRequest() {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.now().plusWeeks(4),
                LocalDate.now().plusDays(1));

        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));

        assertThatThrownBy(() -> recurrenceRuleService.updateRule(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Bitiş tarihi");

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void updateRule_unauthorizedUser_throwsAccessDenied() {
        User other = new User();
        other.setUserId(99);
        rule.setStaff(other);

        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.now().plusDays(2),
                LocalDate.now().plusWeeks(10));

        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));

        assertThatThrownBy(() -> recurrenceRuleService.updateRule(5, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("güncelleme yetkiniz yok");

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void updateRule_ruleNotFound_throwsResourceNotFound() {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.now().plusDays(2),
                LocalDate.now().plusWeeks(10));

        when(recurrenceRuleRepository.findByIdWithStaff(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recurrenceRuleService.updateRule(99, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("bulunamadı");

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void updateRule_pastCompletedRule_throwsBadRequest() {
        rule.setStartDate(LocalDate.now().minusWeeks(8));
        rule.setEndDate(LocalDate.now().minusDays(1));

        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.now().plusDays(2),
                LocalDate.now().plusWeeks(10));

        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));

        assertThatThrownBy(() -> recurrenceRuleService.updateRule(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Geçmişte tamamlanmış");

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void updateRule_pastStartDateInRequest_throwsBadRequest() {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.now().minusDays(1),
                LocalDate.now().plusWeeks(4));

        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));

        assertThatThrownBy(() -> recurrenceRuleService.updateRule(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("gelecek tarihli");

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void endRule_successfulEnd() {
        AvailabilitySlot linked = new AvailabilitySlot();
        linked.setSlotId(1);
        linked.setRecurrenceRule(rule);

        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));
        when(recurrenceRuleRepository.save(rule)).thenReturn(rule);
        when(availabilitySlotRepository.findByRecurrenceRule_RecurrenceRuleId(5))
                .thenReturn(List.of(linked));
        when(availabilitySlotRepository.saveAll(List.of(linked))).thenReturn(List.of(linked));
        when(recurrenceRuleMapper.toResponse(rule)).thenReturn(responseDto);

        RecurrenceRuleResponseDto result = recurrenceRuleService.endRule(5);

        assertThat(result.getRecurrenceRuleId()).isEqualTo(5);
        verify(recurrenceRuleMapper).applyEnd(eq(rule), any(LocalDate.class));
        verify(recurrenceRuleRepository).save(rule);
        assertThat(linked.getRecurrenceRule()).isNull();
        verify(availabilitySlotRepository).saveAll(List.of(linked));
    }

    @Test
    void endRule_unauthorizedUser_throwsAccessDenied() {
        User other = new User();
        other.setUserId(99);
        rule.setStaff(other);
        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));

        assertThatThrownBy(() -> recurrenceRuleService.endRule(5))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("sonlandırma yetkiniz yok");

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void endRule_ruleNotFound_throwsResourceNotFound() {
        when(recurrenceRuleRepository.findByIdWithStaff(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recurrenceRuleService.endRule(99))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("bulunamadı");

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void endRule_alreadyEnded_throwsConflict() {
        rule.setEndDate(LocalDate.now());
        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));

        assertThatThrownBy(() -> recurrenceRuleService.endRule(5))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("daha önce sonlandırılmış");

        verify(recurrenceRuleRepository, never()).save(any());
    }

    @Test
    void createAndUpdate_stillWorkAfterEndFeature() {
        when(availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(1))
                .thenReturn(Optional.of(slot));
        when(recurrenceRuleMapper.toEntity(createRequest, academician)).thenReturn(rule);
        when(recurrenceRuleRepository.save(rule)).thenReturn(rule);
        when(availabilitySlotRepository.save(slot)).thenReturn(slot);
        when(recurrenceRuleMapper.toResponse(rule)).thenReturn(responseDto);

        RecurrenceRuleResponseDto created = recurrenceRuleService.createRule(1, createRequest);
        assertThat(created.getRepeatType()).isEqualTo(RepeatType.WEEKLY.name());

        RecurrenceRuleUpdateRequest updateRequest = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                12,
                LocalDate.now().plusDays(3),
                LocalDate.now().plusWeeks(12));
        when(recurrenceRuleRepository.findByIdWithStaff(5)).thenReturn(Optional.of(rule));

        RecurrenceRuleResponseDto updated = recurrenceRuleService.updateRule(5, updateRequest);
        assertThat(updated.getRecurrenceRuleId()).isEqualTo(5);
        verify(recurrenceRuleMapper).updateEntity(rule, updateRequest);
    }
}
