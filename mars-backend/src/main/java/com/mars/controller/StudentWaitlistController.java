package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.WaitlistEntryResponseDto;
import com.mars.service.WaitlistService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/students/waitlists")
@RequiredArgsConstructor
public class StudentWaitlistController {

    private final WaitlistService waitlistService;

    @GetMapping
    public ResponseEntity<List<WaitlistEntryResponseDto>> getMyWaitlistEntries() {
        return ResponseEntity.ok(waitlistService.getStudentWaitlistEntries());
    }

    @PatchMapping("/{waitlistEntryId}/accept")
    public ResponseEntity<WaitlistEntryResponseDto> acceptOffer(@PathVariable Integer waitlistEntryId) {
        return ResponseEntity.ok(waitlistService.acceptOffer(waitlistEntryId));
    }

    @PatchMapping("/{waitlistEntryId}/reject")
    public ResponseEntity<WaitlistEntryResponseDto> rejectOffer(@PathVariable Integer waitlistEntryId) {
        return ResponseEntity.ok(waitlistService.rejectOffer(waitlistEntryId));
    }
}
