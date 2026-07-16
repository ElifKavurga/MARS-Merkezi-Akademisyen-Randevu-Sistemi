package com.mars.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.RecurrenceRuleMessages;
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
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecurrenceRuleService {

    private final RecurrenceRuleRepository recurrenceRuleRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final RecurrenceRuleMapper recurrenceRuleMapper;

    @Transactional
    public RecurrenceRuleResponseDto createRule(Integer slotId, RecurrenceRuleCreateRequest request) {
        User currentUser = getCurrentUser();
        AvailabilitySlot slot = availabilitySlotRepository.findByIdWithStaffAndRecurrenceRule(slotId)
                .orElseThrow(() -> new ResourceNotFoundException(RecurrenceRuleMessages.SLOT_NOT_FOUND));

        if (slot.getStaff() == null
                || !Objects.equals(slot.getStaff().getUserId(), currentUser.getUserId())) {
            throw new AccessDeniedException(RecurrenceRuleMessages.ACCESS_DENIED);
        }

        if (slot.getRecurrenceRule() != null) {
            throw new ConflictException(RecurrenceRuleMessages.ALREADY_EXISTS);
        }

        validateWeeklyRequest(request.getRepeatType(), request.getRepeatCount(),
                request.getStartDate(), request.getEndDate());

        RecurrenceRule rule = recurrenceRuleMapper.toEntity(request, currentUser);
        RecurrenceRule savedRule = recurrenceRuleRepository.save(rule);
        slot.setRecurrenceRule(savedRule);
        availabilitySlotRepository.save(slot);

        return recurrenceRuleMapper.toResponse(savedRule);
    }

    @Transactional(readOnly = true)
    public RecurrenceRuleResponseDto getRule(Integer recurrenceRuleId) {
        User currentUser = getCurrentUser();
        RecurrenceRule rule = getOwnedRule(recurrenceRuleId, currentUser);
        return recurrenceRuleMapper.toResponse(rule);
    }

    @Transactional
    public RecurrenceRuleResponseDto updateRule(Integer recurrenceRuleId, RecurrenceRuleUpdateRequest request) {
        User currentUser = getCurrentUser();
        RecurrenceRule rule = getOwnedRule(recurrenceRuleId, currentUser);

        if (!RepeatType.WEEKLY.name().equalsIgnoreCase(rule.getRepeatType())) {
            throw new BadRequestException(RecurrenceRuleMessages.ONLY_WEEKLY_SUPPORTED);
        }

        LocalDate today = LocalDate.now();
        if (rule.getEndDate() != null && rule.getEndDate().isBefore(today)) {
            throw new BadRequestException(RecurrenceRuleMessages.PAST_RULE_NOT_UPDATABLE);
        }

        validateWeeklyRequest(request.getRepeatType(), request.getRepeatCount(),
                request.getStartDate(), request.getEndDate());

        String requestedType = request.getRepeatType().trim().toUpperCase();
        if (!RepeatType.WEEKLY.name().equals(requestedType)) {
            throw new BadRequestException(RecurrenceRuleMessages.ONLY_WEEKLY_SUPPORTED);
        }
        if (!requestedType.equalsIgnoreCase(rule.getRepeatType())) {
            throw new BadRequestException(RecurrenceRuleMessages.REPEAT_TYPE_IMMUTABLE);
        }

        if (request.getStartDate().isBefore(today)) {
            throw new BadRequestException(RecurrenceRuleMessages.ONLY_FUTURE_UPDATABLE);
        }

        recurrenceRuleMapper.updateEntity(rule, request);
        RecurrenceRule saved = recurrenceRuleRepository.save(rule);
        return recurrenceRuleMapper.toResponse(saved);
    }

    @Transactional
    public RecurrenceRuleResponseDto endRule(Integer recurrenceRuleId) {
        User currentUser = getCurrentUser();
        RecurrenceRule rule = getOwnedRule(recurrenceRuleId, currentUser, RecurrenceRuleMessages.END_ACCESS_DENIED);

        LocalDate today = LocalDate.now();
        if (rule.getEndDate() != null && rule.getEndDate().isBefore(today)) {
            throw new BadRequestException(RecurrenceRuleMessages.PAST_RULE_NOT_ENDABLE);
        }
        if (rule.getEndDate() != null && !rule.getEndDate().isAfter(today)) {
            throw new ConflictException(RecurrenceRuleMessages.ALREADY_ENDED);
        }

        recurrenceRuleMapper.applyEnd(rule, today);
        RecurrenceRule saved = recurrenceRuleRepository.save(rule);

        List<AvailabilitySlot> linkedSlots =
                availabilitySlotRepository.findByRecurrenceRule_RecurrenceRuleId(recurrenceRuleId);
        for (AvailabilitySlot linkedSlot : linkedSlots) {
            linkedSlot.setRecurrenceRule(null);
        }
        if (!linkedSlots.isEmpty()) {
            availabilitySlotRepository.saveAll(linkedSlots);
        }

        return recurrenceRuleMapper.toResponse(saved);
    }

    private RecurrenceRule getOwnedRule(Integer recurrenceRuleId, User currentUser) {
        return getOwnedRule(recurrenceRuleId, currentUser, RecurrenceRuleMessages.UPDATE_ACCESS_DENIED);
    }

    private RecurrenceRule getOwnedRule(Integer recurrenceRuleId, User currentUser, String accessDeniedMessage) {
        RecurrenceRule rule = recurrenceRuleRepository.findByIdWithStaff(recurrenceRuleId)
                .orElseThrow(() -> new ResourceNotFoundException(RecurrenceRuleMessages.RULE_NOT_FOUND));

        if (rule.getStaff() == null
                || !Objects.equals(rule.getStaff().getUserId(), currentUser.getUserId())) {
            throw new AccessDeniedException(accessDeniedMessage);
        }
        return rule;
    }

    private void validateWeeklyRequest(
            String repeatType,
            Integer repeatCount,
            LocalDate startDate,
            LocalDate endDate) {
        if (startDate == null) {
            throw new BadRequestException(RecurrenceRuleMessages.START_DATE_REQUIRED);
        }
        if (endDate == null) {
            throw new BadRequestException(RecurrenceRuleMessages.END_DATE_REQUIRED);
        }
        if (repeatCount == null || repeatCount <= 0) {
            throw new BadRequestException(RecurrenceRuleMessages.INVALID_REPEAT_COUNT);
        }
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException(RecurrenceRuleMessages.INVALID_DATE_RANGE);
        }

        String normalizedType = repeatType == null ? "" : repeatType.trim().toUpperCase();
        if (!RepeatType.WEEKLY.name().equals(normalizedType)) {
            throw new BadRequestException(RecurrenceRuleMessages.ONLY_WEEKLY_SUPPORTED);
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return userDetails.getUser();
    }
}
