package com.mars.mapper;

import org.springframework.stereotype.Component;

import com.mars.dto.RecurrenceRuleCreateRequest;
import com.mars.dto.RecurrenceRuleResponseDto;
import com.mars.dto.RecurrenceRuleUpdateRequest;
import com.mars.entity.RecurrenceRule;
import com.mars.entity.User;

@Component
public class RecurrenceRuleMapper {

    public RecurrenceRule toEntity(RecurrenceRuleCreateRequest request, User staff) {
        RecurrenceRule rule = new RecurrenceRule();
        rule.setStaff(staff);
        rule.setRepeatType(request.getRepeatType().trim().toUpperCase());
        rule.setRepeatCount(request.getRepeatCount());
        rule.setStartDate(request.getStartDate());
        rule.setEndDate(request.getEndDate());
        return rule;
    }

    public void updateEntity(RecurrenceRule rule, RecurrenceRuleUpdateRequest request) {
        rule.setRepeatCount(request.getRepeatCount());
        rule.setStartDate(request.getStartDate());
        rule.setEndDate(request.getEndDate());
    }

    public void applyEnd(RecurrenceRule rule, java.time.LocalDate endDate) {
        rule.setEndDate(endDate);
    }

    public RecurrenceRuleResponseDto toResponse(RecurrenceRule rule) {
        return RecurrenceRuleResponseDto.builder()
                .recurrenceRuleId(rule.getRecurrenceRuleId())
                .repeatType(rule.getRepeatType())
                .repeatCount(rule.getRepeatCount())
                .startDate(rule.getStartDate())
                .endDate(rule.getEndDate())
                .build();
    }
}
