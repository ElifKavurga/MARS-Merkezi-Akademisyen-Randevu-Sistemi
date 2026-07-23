package com.mars.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.CreateDelegationRequest;
import com.mars.dto.DelegationResponse;
import com.mars.dto.DelegationTargetResponse;
import com.mars.service.DelegationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/delegations")
@RequiredArgsConstructor
public class DelegationController {

    private final DelegationService delegationService;

    @PostMapping
    public ResponseEntity<DelegationResponse> createDelegation(
            @Valid @RequestBody CreateDelegationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(delegationService.createDelegation(request));
    }

    @GetMapping("/targets")
    public ResponseEntity<List<DelegationTargetResponse>> getDelegationTargets(
            @RequestParam Integer appointmentId) {
        return ResponseEntity.ok(delegationService.getDelegationTargets(appointmentId));
    }

    @GetMapping("/student/pending")
    public ResponseEntity<List<DelegationResponse>> getPendingStudentApprovals() {
        return ResponseEntity.ok(delegationService.getPendingStudentApprovals());
    }

    @PostMapping("/{id}/student-accept")
    public ResponseEntity<DelegationResponse> acceptStudentApproval(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(delegationService.acceptStudentApproval(id));
    }

    @PostMapping("/{id}/student-reject")
    public ResponseEntity<DelegationResponse> rejectStudentApproval(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(delegationService.rejectStudentApproval(id));
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<DelegationResponse>> getIncomingDelegations() {
        return ResponseEntity.ok(delegationService.getIncomingDelegations());
    }

    @GetMapping("/history")
    public ResponseEntity<List<DelegationResponse>> getDelegationHistory() {
        return ResponseEntity.ok(delegationService.getDelegationHistory());
    }

    @GetMapping("/sent")
    public ResponseEntity<List<DelegationResponse>> getSentDelegations() {
        return ResponseEntity.ok(delegationService.getSentDelegations());
    }

    @GetMapping("/received")
    public ResponseEntity<List<DelegationResponse>> getReceivedDelegations() {
        return ResponseEntity.ok(delegationService.getReceivedDelegations());
    }

    @GetMapping("/student/history")
    public ResponseEntity<List<DelegationResponse>> getStudentDelegations() {
        return ResponseEntity.ok(delegationService.getStudentDelegations());
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<DelegationResponse> acceptDelegation(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(delegationService.acceptDelegation(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<DelegationResponse> rejectDelegation(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(delegationService.rejectDelegation(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DelegationResponse> getDelegation(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(delegationService.getDelegation(id));
    }
}
