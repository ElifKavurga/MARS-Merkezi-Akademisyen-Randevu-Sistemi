package com.mars.controller;

import java.util.List;

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

import com.mars.dto.AvailabilitySlotBlockRequest;
import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.dto.AvailabilitySlotStatsResponseDto;
import com.mars.dto.AvailabilitySlotUpdateRequest;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.service.AvailabilitySlotService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/availability-slots")
@RequiredArgsConstructor
public class AvailabilitySlotController {

    private final AvailabilitySlotService availabilitySlotService;

    @GetMapping("/my")
    public ResponseEntity<List<AvailabilitySlotResponseDto>> getMySlots() {
        return ResponseEntity.ok(availabilitySlotService.getMySlots());
    }

    @GetMapping("/my/stats")
    public ResponseEntity<AvailabilitySlotStatsResponseDto> getMyStats() {
        return ResponseEntity.ok(availabilitySlotService.getMyStats());
    }

    @GetMapping("/available")
    public ResponseEntity<List<AvailableSlotResponseDto>> getAvailableSlots(
            @RequestParam Integer staffId) {
        return ResponseEntity.ok(availabilitySlotService.getAvailableSlotsForStaff(staffId));
    }

    @PostMapping
    public ResponseEntity<List<AvailabilitySlotResponseDto>> createSlots(
            @Valid @RequestBody AvailabilitySlotCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(availabilitySlotService.createSlots(request));
    }

    @PutMapping("/{slotId}")
    public ResponseEntity<AvailabilitySlotResponseDto> updateSlot(
            @PathVariable Integer slotId,
            @Valid @RequestBody AvailabilitySlotUpdateRequest request) {
        return ResponseEntity.ok(availabilitySlotService.updateSlot(slotId, request));
    }

    @PatchMapping("/{slotId}/blocked")
    public ResponseEntity<AvailabilitySlotResponseDto> updateBlockedStatus(
            @PathVariable Integer slotId,
            @Valid @RequestBody AvailabilitySlotBlockRequest request) {
        return ResponseEntity.ok(availabilitySlotService.updateBlockedStatus(slotId, request));
    }
}
