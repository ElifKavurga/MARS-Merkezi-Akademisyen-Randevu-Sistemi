package com.mars.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.admin.PenaltyRuleResponse;
import com.mars.dto.admin.UpdatePenaltyRuleRequest;
import com.mars.service.AdminPenaltyRuleService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/penalty-rule")
@RequiredArgsConstructor
public class AdminPenaltyRuleController {

    private final AdminPenaltyRuleService adminPenaltyRuleService;

    @GetMapping
    public ResponseEntity<PenaltyRuleResponse> getPenaltyRule() {
        return ResponseEntity.ok(adminPenaltyRuleService.getPenaltyRule());
    }

    @PutMapping
    public ResponseEntity<PenaltyRuleResponse> updatePenaltyRule(
            @RequestBody UpdatePenaltyRuleRequest request) {
        return ResponseEntity.ok(adminPenaltyRuleService.updatePenaltyRule(request));
    }
}
