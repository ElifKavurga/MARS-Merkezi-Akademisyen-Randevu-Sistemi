package com.mars.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.RecurrenceRuleCreateRequest;
import com.mars.dto.RecurrenceRuleResponseDto;
import com.mars.dto.RecurrenceRuleUpdateRequest;
import com.mars.service.RecurrenceRuleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/recurrence-rules")
@RequiredArgsConstructor
public class RecurrenceRuleController {

    private final RecurrenceRuleService recurrenceRuleService;

    @GetMapping("/{recurrenceRuleId}")
    public ResponseEntity<RecurrenceRuleResponseDto> getRule(@PathVariable Integer recurrenceRuleId) {
        return ResponseEntity.ok(recurrenceRuleService.getRule(recurrenceRuleId));
    }

    @PostMapping
    public ResponseEntity<RecurrenceRuleResponseDto> createRule(
            @RequestParam Integer slotId,
            @Valid @RequestBody RecurrenceRuleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recurrenceRuleService.createRule(slotId, request));
    }

    @PutMapping("/{recurrenceRuleId}")
    public ResponseEntity<RecurrenceRuleResponseDto> updateRule(
            @PathVariable Integer recurrenceRuleId,
            @Valid @RequestBody RecurrenceRuleUpdateRequest request) {
        return ResponseEntity.ok(recurrenceRuleService.updateRule(recurrenceRuleId, request));
    }

    @PatchMapping("/{recurrenceRuleId}/end")
    public ResponseEntity<RecurrenceRuleResponseDto> endRule(@PathVariable Integer recurrenceRuleId) {
        return ResponseEntity.ok(recurrenceRuleService.endRule(recurrenceRuleId));
    }
}
