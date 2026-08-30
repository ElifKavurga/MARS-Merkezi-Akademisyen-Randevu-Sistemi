package com.mars.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mars.dto.admin.PenaltyRuleResponse;
import com.mars.dto.admin.UpdatePenaltyRuleRequest;
import com.mars.entity.PenaltyRule;
import com.mars.exception.BadRequestException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.PenaltyRuleMapper;
import com.mars.repository.PenaltyRuleRepository;

@ExtendWith(MockitoExtension.class)
class AdminPenaltyRuleServiceTest {

    @Mock
    private PenaltyRuleRepository penaltyRuleRepository;

    @Mock
    private PenaltyRuleMapper penaltyRuleMapper;

    @InjectMocks
    private AdminPenaltyRuleService adminPenaltyRuleService;

    private PenaltyRule existing;

    @BeforeEach
    void setUp() {
        existing = new PenaltyRule(1, 3, 7, true);
    }

    @Test
    void getPenaltyRule_returnsSingleton() {
        PenaltyRuleResponse response = PenaltyRuleResponse.builder()
                .penaltyRuleId(1)
                .maxNoShowCount(3)
                .banDurationDays(7)
                .isActive(true)
                .build();

        when(penaltyRuleRepository.findFirstByOrderByPenaltyRuleIdAsc())
                .thenReturn(Optional.of(existing));
        when(penaltyRuleMapper.toResponse(existing)).thenReturn(response);

        PenaltyRuleResponse result = adminPenaltyRuleService.getPenaltyRule();

        assertThat(result.getPenaltyRuleId()).isEqualTo(1);
        assertThat(result.getMaxNoShowCount()).isEqualTo(3);
        verify(penaltyRuleRepository, never()).save(any());
    }

    @Test
    void updatePenaltyRule_updatesFields() {
        UpdatePenaltyRuleRequest request = new UpdatePenaltyRuleRequest(4, 14, false);
        PenaltyRuleResponse response = PenaltyRuleResponse.builder()
                .penaltyRuleId(1)
                .maxNoShowCount(4)
                .banDurationDays(14)
                .isActive(false)
                .build();

        when(penaltyRuleRepository.findFirstByOrderByPenaltyRuleIdAsc())
                .thenReturn(Optional.of(existing));
        when(penaltyRuleRepository.save(existing)).thenReturn(existing);
        when(penaltyRuleMapper.toResponse(existing)).thenReturn(response);

        PenaltyRuleResponse result = adminPenaltyRuleService.updatePenaltyRule(request);

        verify(penaltyRuleMapper).updateEntity(existing, request);
        verify(penaltyRuleRepository).save(existing);
        assertThat(result.getMaxNoShowCount()).isEqualTo(4);
        assertThat(result.getBanDurationDays()).isEqualTo(14);
        assertThat(result.getIsActive()).isFalse();
    }

    @Test
    void updatePenaltyRule_rejectsNonPositiveMaxNoShow() {
        UpdatePenaltyRuleRequest request = new UpdatePenaltyRuleRequest(0, 7, true);

        assertThatThrownBy(() -> adminPenaltyRuleService.updatePenaltyRule(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("katılmama limiti");

        verify(penaltyRuleRepository, never()).save(any());
    }

    @Test
    void updatePenaltyRule_rejectsNonPositiveBanDays() {
        UpdatePenaltyRuleRequest request = new UpdatePenaltyRuleRequest(3, 0, true);

        assertThatThrownBy(() -> adminPenaltyRuleService.updatePenaltyRule(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Ceza süresi");
    }

    @Test
    void getPenaltyRule_missingRule_throwsNotFound() {
        when(penaltyRuleRepository.findFirstByOrderByPenaltyRuleIdAsc())
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminPenaltyRuleService.getPenaltyRule())
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
