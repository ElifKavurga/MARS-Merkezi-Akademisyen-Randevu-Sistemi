package com.mars.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.admin.PenaltyRuleResponse;
import com.mars.dto.admin.UpdatePenaltyRuleRequest;
import com.mars.entity.PenaltyRule;
import com.mars.exception.BadRequestException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.PenaltyRuleMapper;
import com.mars.repository.PenaltyRuleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminPenaltyRuleService {

    private final PenaltyRuleRepository penaltyRuleRepository;
    private final PenaltyRuleMapper penaltyRuleMapper;

    @Transactional(readOnly = true)
    public PenaltyRuleResponse getPenaltyRule() {
        return penaltyRuleMapper.toResponse(requireSingletonRule());
    }

    @Transactional
    public PenaltyRuleResponse updatePenaltyRule(UpdatePenaltyRuleRequest request) {
        validateRequest(request);

        PenaltyRule penaltyRule = requireSingletonRule();
        penaltyRuleMapper.updateEntity(penaltyRule, request);
        PenaltyRule saved = penaltyRuleRepository.save(penaltyRule);
        return penaltyRuleMapper.toResponse(saved);
    }

    private PenaltyRule requireSingletonRule() {
        return penaltyRuleRepository.findFirstByOrderByPenaltyRuleIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException("Ceza kuralı bulunamadı."));
    }

    private void validateRequest(UpdatePenaltyRuleRequest request) {
        if (request.getMaxNoShowCount() == null || request.getMaxNoShowCount() <= 0) {
            throw new BadRequestException("Randevuya katılmama limiti 0'dan büyük olmalıdır.");
        }
        if (request.getBanDurationDays() == null || request.getBanDurationDays() <= 0) {
            throw new BadRequestException("Ceza süresi 0'dan büyük olmalıdır.");
        }
        if (request.getIsActive() == null) {
            throw new BadRequestException("Sistem aktiflik bilgisi zorunludur.");
        }
    }
}
