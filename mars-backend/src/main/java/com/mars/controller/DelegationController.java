package com.mars.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.CreateDelegationRequest;
import com.mars.dto.DelegationResponse;
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

    @GetMapping("/{id}")
    public ResponseEntity<DelegationResponse> getDelegation(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(delegationService.getDelegation(id));
    }
}
