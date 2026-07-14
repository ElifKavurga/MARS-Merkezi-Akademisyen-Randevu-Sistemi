package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.admin.PenaltyRuleResponse;
import com.mars.dto.admin.UpdatePenaltyRuleRequest;
import com.mars.entity.PenaltyRule;

@Component
public class PenaltyRuleMapper {

    public PenaltyRuleResponse toResponse(PenaltyRule penaltyRule) {
        return PenaltyRuleResponse.builder()
                .penaltyRuleId(penaltyRule.getPenaltyRuleId())
                .maxNoShowCount(penaltyRule.getMaxNoShowCount())
                .banDurationDays(penaltyRule.getBanDurationDays())
                .isActive(penaltyRule.getIsActive())
                .build();
    }

    public void updateEntity(PenaltyRule penaltyRule, UpdatePenaltyRuleRequest request) {
        penaltyRule.setMaxNoShowCount(request.getMaxNoShowCount());
        penaltyRule.setBanDurationDays(request.getBanDurationDays());
        penaltyRule.setIsActive(request.getIsActive());
    }
}
